import { commands, ConfigurationChangeEvent, DecorationOptions, Disposable, Range, Selection, TextEditor, TextEditorSelectionChangeEvent, window, workspace, TextEditorVisibleRangesChangeEvent } from 'vscode';
import { getVisibleLines } from './get_lines';
import { SettingNamespace, Settings } from './settings';
import { ExtensionComponent, Nullable } from './typings';
import { CallDeferred } from './deferred';

// TODO: Measure performance of every bigger code chunks

const enum Command {
    Type = 'type',
    Exit = 'extension.jumpy-exit',
    Enter = 'extension.jumpy-enter',
}

const enum Event {
    ConfigChanged = 'configChanged',
    ActiveEditorChanged = 'activeEditorChanged',
    ActiveSelectionChanged = 'activeSelectionChanged',
    VisibleRangesChanged = 'visibleRangesChanged',
}

interface JumpPosition {
    line: number;
    char: number;
}

interface JumpPositionMap {
    [code: string]: JumpPosition;
}

interface StateJumpActive {
    isInJumpMode: true;
    editor: TextEditor;
    visibleRangesNotYetUpdated: boolean;
}

interface StateJumpInactive {
    isInJumpMode: false;
    editor: undefined;
    visibleRangesNotYetUpdated: boolean;
}

type State = StateJumpActive | StateJumpInactive;

// interface State {
//     selection?: Selection;
//     editor?: TextEditor;
//     isInJumpMode: boolean;
// }

const HANDLE_NAMES = [Command.Type, Command.Exit, Command.Enter, Event.ConfigChanged, Event.ActiveEditorChanged, Event.ActiveSelectionChanged, Event.VisibleRangesChanged] as const;
const NO_DECORATIONS: any[] = [];
const DEFAULT_STATE: State = {
    isInJumpMode: false,
    editor: undefined,
    visibleRangesNotYetUpdated: false,
};

export class Jumpy implements ExtensionComponent {
    private handles: Record<Command | Event, Nullable<Disposable>>;
    private settings: Settings;
    private positions: JumpPositionMap;
    private state: State;
    private redraw: CallDeferred;

    public constructor() {
        this.state = { isInJumpMode: false, editor: undefined, visibleRangesNotYetUpdated: false };
        this.handles = {
            [Command.Type]: null,
            [Command.Exit]: null,
            [Command.Enter]: null,
            [Event.ConfigChanged]: null,
            [Event.ActiveEditorChanged]: null,
            [Event.ActiveSelectionChanged]: null,
            [Event.VisibleRangesChanged]: null,
        };
        this.settings = new Settings();
        this.positions = {};
        this.redraw = new CallDeferred();
    }

    public activate(): void {
        this.settings.activate();

        this.handles[Command.Enter] = commands.registerCommand(Command.Enter, this.handleEnterJumpMode);
        this.handles[Command.Exit] = commands.registerCommand(Command.Exit, this.handleExitJumpMode);
        this.handles[Event.ConfigChanged] = workspace.onDidChangeConfiguration(this.handleConfigChange);
        this.handles[Event.ActiveSelectionChanged] = window.onDidChangeTextEditorSelection(this.handleSelectionChange);
        this.handles[Event.ActiveEditorChanged] = window.onDidChangeActiveTextEditor(this.handleEditorChange);
        this.handles[Event.VisibleRangesChanged] = window.onDidChangeTextEditorVisibleRanges(this.handleVisibleRangesChange);
    }

    public deactivate(): void {
        this.handleExitJumpMode();
        this.settings.deactivate();

        for (const handleName of HANDLE_NAMES) {
            this.tryDispose(handleName);
        }
    }

    private handleConfigChange = (event: ConfigurationChangeEvent): void => {
        if (this.state.isInJumpMode) {
            this.setDecorations(this.state.editor, NO_DECORATIONS);
            this.settings.handleConfigurationChange(event);
            this.showDecorations(this.state.editor);
        } else {
            this.settings.handleConfigurationChange(event);
        }
    };

    private handleVisibleRangesChange = (_event: TextEditorVisibleRangesChangeEvent): void => {
        if (!this.state.isInJumpMode || !this.state.visibleRangesNotYetUpdated) {
            return;
        }

        this.showDecorations(this.state.editor);
        this.state.visibleRangesNotYetUpdated = false;
    };

    private handleSelectionChange = (_event: TextEditorSelectionChangeEvent): void => {
        if (!this.state.isInJumpMode || this.state.visibleRangesNotYetUpdated) {
            return;
        }

        this.showDecorations(this.state.editor);
    };

    private handleEditorChange = (editor: TextEditor | undefined): void => {
        if (!this.state.isInJumpMode) {
            return;
        }

        if (editor === undefined) {
            this.handleExitJumpMode();
        } else {
            this.setDecorations(this.state.editor, NO_DECORATIONS);
            this.state.editor = editor;
            this.showDecorations(this.state.editor);
        }
    };

    private tryDispose (handleName: Command | Event): void {
        const handle = this.handles[handleName];
        if (handle != null) {
            handle.dispose();
            this.handles[handleName] = null;
        }
    }

    private handleEnterJumpMode = (): void => {
        const activeEditor = window.activeTextEditor;
        if (activeEditor === undefined) {
            return;
        }

        this.setJumpyContext(true);
        this.handles[Command.Type] = commands.registerCommand(Command.Type, this.handleTypeEvent);

        this.state.editor = activeEditor;

        this.showDecorations(this.state.editor);
    };

    private handleExitJumpMode = (): void => {

        if (!this.state.isInJumpMode) {
            return;
        }

        this.setDecorations(this.state.editor, NO_DECORATIONS);
        this.state = DEFAULT_STATE;

        this.tryDispose(Command.Type);
        this.setJumpyContext(false);
    };

    private handleTypeEvent = (type: any): void => {
        // do sth
    };

    private setJumpyContext (value: boolean): void {

        commands.executeCommand('setContext', 'jumpy.isInJumpMode', value);
        this.state.isInJumpMode = value;
    }

    private setDecorations (editor: TextEditor, decorationInstanceOptions: DecorationOptions[]): void {
        if (editor !== undefined) {
            editor.setDecorations(this.settings.decorationType, decorationInstanceOptions);
        }
    }

    private showDecorations (editor: TextEditor): void {
        console.time('Jumpy.showDecorations');

        console.time('getVisibleLines');
        const lines = getVisibleLines(editor);
        console.timeEnd('getVisibleLines');

        if (lines === null) {
            this.state.visibleRangesNotYetUpdated = true;
            console.timeEnd('Jumpy.showDecorations');
            return;
        }

        const decorationOptions: DecorationOptions[] = [];

        this.positions = {};
        let positionCount = 0;
        const linesCount = lines.length;
        const maxDecorations = this.settings.codes.length;

        for (let i = 0; i < linesCount && positionCount < maxDecorations; i++) {
            const text = lines[i].text;

            let regexpResult = this.settings.wordRegexp.exec(text);
            while (regexpResult != null && positionCount < maxDecorations) {
                const code = this.settings.codes[positionCount];
                const position = {
                    line: lines[i].lineNumber,
                    char: regexpResult.index,
                };

                this.positions[code] = position;
                decorationOptions.push({
                    range: new Range(position.line, position.char, position.line, position.char),
                    renderOptions: this.settings.getOptions(code)
                });

                positionCount += 1;
                regexpResult = this.settings.wordRegexp.exec(text);
            }
        }

        this.setDecorations(editor, decorationOptions);
        console.timeEnd('Jumpy.showDecorations');
    }
}

import {
    commands,
    ConfigurationChangeEvent,
    DecorationOptions,
    Disposable,
    Range,
    Selection,
    TextEditor,
    TextEditorSelectionChangeEvent,
    TextEditorVisibleRangesChangeEvent,
    window,
    workspace,
} from 'vscode';
import { getVisibleLines } from './get_lines';
import { Settings } from './settings';
import { ExtensionComponent, Nullable } from './typings';

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
    typedCharacters: string;
}

interface StateJumpInactive {
    isInJumpMode: false;
    editor: undefined;
    visibleRangesNotYetUpdated: boolean;
    typedCharacters: string;
}

type State = StateJumpActive | StateJumpInactive;

const HANDLE_NAMES = [
    Command.Type,
    Command.Exit,
    Command.Enter,
    Event.ConfigChanged,
    Event.ActiveEditorChanged,
    Event.ActiveSelectionChanged,
    Event.VisibleRangesChanged,
] as const;
const NO_DECORATIONS: DecorationOptions[] = [];
const DEFAULT_STATE: State = {
    isInJumpMode: false,
    editor: undefined,
    visibleRangesNotYetUpdated: false,
    typedCharacters: '',
};
const TYPE_REGEX = /\w/;

export class Jumpy implements ExtensionComponent {
    private handles: Record<Command | Event, Nullable<Disposable>>;
    private settings: Settings;
    private positions: JumpPositionMap;
    private state: State;

    public constructor() {
        this.state = {
            isInJumpMode: false,
            editor: undefined,
            visibleRangesNotYetUpdated: false,
            typedCharacters: '',
        };
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
    }

    public activate(): void {
        this.settings.activate();

        this.handles[Command.Enter] = commands.registerCommand(
            Command.Enter,
            this.handleEnterJumpMode,
        );
        this.handles[Command.Exit] = commands.registerCommand(
            Command.Exit,
            this.handleExitJumpMode,
        );
        this.handles[Event.ConfigChanged] = workspace.onDidChangeConfiguration(
            this.handleConfigChange,
        );
        this.handles[Event.ActiveSelectionChanged] = window.onDidChangeTextEditorSelection(
            this.handleSelectionChange,
        );
        this.handles[Event.ActiveEditorChanged] = window.onDidChangeActiveTextEditor(
            this.handleEditorChange,
        );
        this.handles[Event.VisibleRangesChanged] = window.onDidChangeTextEditorVisibleRanges(
            this.handleVisibleRangesChange,
        );
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

    private tryDispose(handleName: Command | Event): void {
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
        this.state = Object.assign({}, DEFAULT_STATE);

        this.tryDispose(Command.Type);
        this.setJumpyContext(false);
    };

    private handleTypeEvent = (type: { text: string }): void => {
        if (!TYPE_REGEX.test(type.text) || !this.state.isInJumpMode) {
            this.state.typedCharacters = '';
            return;
        }

        if (this.state.typedCharacters.length === 0) {
            this.state.typedCharacters += type.text.toLowerCase();
            return;
        }

        // Should it allow expanding selection from current selection to the targeted marker
        // if the key was pressed with [Shift]?
        const code = this.state.typedCharacters + type.text.toLowerCase();
        const position = this.positions[code];

        if (position === undefined) {
            window.showErrorMessage(`Jumpy error, missing code: "${code}".`);
            this.handleExitJumpMode();
            return;
        }

        this.state.editor.selection = new Selection(
            position.line,
            position.char,
            position.line,
            position.char,
        );

        this.handleExitJumpMode();
    };

    private setJumpyContext(value: boolean): void {
        commands.executeCommand('setContext', 'jumpy.isInJumpMode', value);
        this.state.isInJumpMode = value;
    }

    private setDecorations(
        editor: TextEditor,
        decorationInstanceOptions: DecorationOptions[],
    ): void {
        if (editor !== undefined) {
            editor.setDecorations(this.settings.decorationType, decorationInstanceOptions);
        }
    }

    private showDecorations(editor: TextEditor): void {
        const lines = getVisibleLines(editor);

        if (lines === null) {
            this.state.visibleRangesNotYetUpdated = true;
            return;
        }

        const decorationOptions: DecorationOptions[] = [];

        this.positions = {};
        let positionCount = 0;
        const linesCount = lines.length;
        const maxDecorations = this.settings.codes.length;

        for (let i = 0; i < linesCount && positionCount < maxDecorations; i++) {
            for (const match of lines[i].text.matchAll(this.settings.wordRegexp)) {
                if (positionCount >= maxDecorations) {
                    break;
                }
                if (match.index === undefined) {
                    continue;
                }

                const code = this.settings.codes[positionCount];
                const position = {
                    line: lines[i].lineNumber,
                    char: match.index,
                };

                const line = position.line;
                const char = position.char + this.settings.charOffset;

                this.positions[code] = position;
                decorationOptions.push({
                    range: new Range(line, char, line, char),
                    renderOptions: this.settings.getOptions(code),
                });

                positionCount += 1;
            }
        }

        this.setDecorations(editor, decorationOptions);
    }
}

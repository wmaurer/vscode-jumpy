import { TextEditorDecorationType, window, workspace } from 'vscode';

export const enum Settings {
    EditorNamespace = 'editor',
    ExtNamespace = 'jumpy',
    WordRegexp = 'wordRegexp',
    LineRegexp = 'lineRegexp',
    FontSize = 'fontSize',
    FontFamily = 'fontFamily',
    DarkThemeBackground = 'darkThemeBackground',
    DarkThemeForeground = 'darkThemeForeground',
    LightThemeBackground = 'lightThemeBackground',
    LightThemeForeground = 'lightThemeForeground',
    ColorTheme = 'colorTheme',
}

interface DecorationConfig {
    pad: number;
    fontSize: number;
    fontFamily: string;
    margin: string;
    color: string;
    width: string;
    backgroundColor: string;
    light: {
        color: string;
        backgroundColor: string;
    }
}

const REGEX_WORD = /\w{2,}/g;
const REGEX_LINE = /^\s*$/g;

export class ExtSettings {
    public decorationConfig: DecorationConfig = ({} as unknown) as DecorationConfig;
    public decorationType: TextEditorDecorationType = ({} as unknown) as TextEditorDecorationType;
    public wordRegexp: RegExp = REGEX_WORD;
    public lineRegexp: RegExp = REGEX_LINE;

    constructor() {
        this.refreshConfig();
    }

    public refreshConfig(): void {
        const extensionConfig = workspace.getConfiguration(Settings.ExtNamespace);
        const editorConfig = workspace.getConfiguration(Settings.EditorNamespace);

        const fontFamily: string =
            extensionConfig[Settings.FontFamily] || editorConfig[Settings.FontFamily];
        const fontSize: number =
            extensionConfig[Settings.FontSize] || editorConfig[Settings.FontSize];
        const fgDark: string = extensionConfig[Settings.DarkThemeForeground];
        const bgDark: string = extensionConfig[Settings.DarkThemeBackground];
        const fgLight: string = extensionConfig[Settings.LightThemeForeground];
        const bgLight: string = extensionConfig[Settings.LightThemeBackground];

        const pad = fontSize * 0.2;

        this.decorationConfig = {
            pad,
            fontSize,
            fontFamily,
            color: fgDark,
            backgroundColor: bgDark,
            margin: `0 0 0 -${fontSize + pad}px`,
            width: `${fontSize + pad}px`,
            light: {
                color: fgLight,
                backgroundColor: bgLight,
            }
        };

        this.decorationType = window.createTextEditorDecorationType({
            after: this.decorationConfig,
        });

        const wordRegexp = extensionConfig[Settings.WordRegexp];
        const lineRegexp = extensionConfig[Settings.LineRegexp];

        this.wordRegexp = wordRegexp ? new RegExp(wordRegexp, 'g') : REGEX_WORD;
        this.lineRegexp = lineRegexp ? new RegExp(lineRegexp, 'g') : REGEX_LINE;
    }
}

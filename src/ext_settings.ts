import { workspace, ThemeColor, TextEditorDecorationType, window } from 'vscode';

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
    fontSize: number;
    fontFamily: string;
    color: string | ThemeColor;
    margin: string;
    width: string;
    backgroundColor: string | ThemeColor;
    light: {
        color: string;
        backgroundColor: string;
    };
}

const REGEX_WORD = /\w{2,}/g;
const REGEX_LINE = /^\s*$/g;

export class ExtSettings {
    public decorationConfig: DecorationConfig = {} as unknown as DecorationConfig;
    public decorationType: TextEditorDecorationType = {} as unknown as TextEditorDecorationType;
    public wordRegexp: RegExp = REGEX_WORD;
    public lineRegexp: RegExp = REGEX_LINE;

    constructor () {
        this.refreshConfig();
    }

    public refreshConfig () {
        const extensionConfig = workspace.getConfiguration(Settings.ExtNamespace);
        const editorConfig =  workspace.getConfiguration(Settings.EditorNamespace);

        const fontFamily = extensionConfig[Settings.FontFamily] || editorConfig[Settings.FontFamily];
        const fontSize = extensionConfig[Settings.FontSize] || editorConfig[Settings.FontSize];
        const fgDark = extensionConfig[Settings.DarkThemeForeground] || new ThemeColor(editorConfig[Settings.ColorTheme]);
        const bgDark = extensionConfig[Settings.DarkThemeBackground] || new ThemeColor(editorConfig[Settings.ColorTheme]);
        const fgLight = extensionConfig[Settings.LightThemeForeground];
        const bgLight = extensionConfig[Settings.LightThemeBackground];

        const margin = fontSize * 0.2;

        this.decorationConfig = {
            fontSize,
            fontFamily,
            color: fgDark,
            backgroundColor: bgDark,
            margin: `0 0 0 -${fontSize + margin}px`,
            width: `${fontSize + margin}px`,
            light: {
                color: fgLight,
                backgroundColor: bgLight,
            },
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

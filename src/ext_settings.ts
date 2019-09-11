import { DecorationOptions, Range, TextEditorDecorationType, window, workspace } from 'vscode';

const enum Settings {
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
}

interface DecorStyle {
    fontSize: number;
    fontFamily: string;
    color: string;
    backgroundColor: string;
    light: {
        color: string;
        backgroundColor: string;
    };
}

const REGEX_WORD = /\w{2,}/g;
let USER_REGEX_WORD_TEXT = '';
let USER_REGEX_WORD_INST = REGEX_WORD;

const REGEX_LINE = /^\s*$/g;
let USER_REGEX_LINE_TEXT = '';
let USER_REGEX_LINE_INST = REGEX_LINE;

export const getWordRegex = (): RegExp => {
    const extensionConfig = workspace.getConfiguration(Settings.ExtNamespace);
    const wordRegexpSetting = extensionConfig && extensionConfig[Settings.WordRegexp];
    if (!wordRegexpSetting) {
        return REGEX_WORD;
    }
    if (wordRegexpSetting === USER_REGEX_WORD_TEXT) {
        return USER_REGEX_WORD_INST;
    }

    USER_REGEX_WORD_TEXT = wordRegexpSetting;
    return (USER_REGEX_WORD_INST = new RegExp(wordRegexpSetting, 'g'));
};

export const getLineRegex = (): RegExp => {
    const extensionConfig = workspace.getConfiguration(Settings.ExtNamespace);
    const lineRegexpSetting = extensionConfig && extensionConfig[Settings.LineRegexp];
    if (!lineRegexpSetting) {
        return REGEX_LINE;
    }
    if (lineRegexpSetting === USER_REGEX_LINE_TEXT) {
        return USER_REGEX_LINE_INST;
    }
    USER_REGEX_LINE_TEXT = lineRegexpSetting;
    return (USER_REGEX_LINE_INST = new RegExp(lineRegexpSetting, 'g'));
};

function initializeConfiguration(): DecorStyle {
    const extensionConfig = workspace.getConfiguration(Settings.ExtNamespace);
    const editorConfig = workspace.getConfiguration(Settings.EditorNamespace);

    const fontFamily = extensionConfig[Settings.FontFamily] || editorConfig[Settings.FontFamily];
    const fontSize = extensionConfig[Settings.FontSize] || editorConfig[Settings.FontSize];

    return {
        fontFamily,
        fontSize,
        color: extensionConfig[Settings.DarkThemeForeground],
        backgroundColor: extensionConfig[Settings.DarkThemeBackground],
        light: {
            color: extensionConfig[Settings.LightThemeForeground],
            backgroundColor: extensionConfig[Settings.LightThemeBackground],
        },
    };
}

export function createTextEditorDecorationType(): TextEditorDecorationType {
    return window.createTextEditorDecorationType({
        after: initializeConfiguration(),
    });
}

export function createDecorationOptions(
    line: number,
    startCharacter: number,
    code: string,
): DecorationOptions {
    return {
        range: new Range(line, startCharacter, line, startCharacter),
        renderOptions: {
            dark: {
                after: {
                    contentText: code,
                },
            },
            light: {
                after: {
                    contentText: code,
                },
            },
        },
    };
}

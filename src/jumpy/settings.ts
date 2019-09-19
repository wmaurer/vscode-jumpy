import { ConfigurationChangeEvent, DecorationInstanceRenderOptions, TextEditorDecorationType, Uri, window, workspace } from 'vscode';
import { createCharCodeSet } from './char_code';
import { ExtensionComponent } from './typings';

export const enum SettingNamespace {
    Editor = 'editor',
    Jumpy = 'jumpy',
    JumpyDisplay = 'jumpy.display',
}

const enum Setting {
    Display = 'display',
    UseIcons = 'useIcons',
    EnableDisplaySwitch = 'enableDisplaySwitch',
    WordRegexp = 'wordRegexp',
    WordRegexpFlags = 'wordRegexpFlags',
    PrimaryCharset = 'primaryCharset',
}

const enum DisplaySetting {
    FontFamily = 'display.fontFamily',
    FontSize = 'display.fontSize',
    Color = 'display.color',
    BackgroundColor = 'display.backgroundColor',
}

interface DecorationOptions {
    fontFamily?: string;
    fontSize?: number;
    color?: string;
    background?: string;
    width?: string;
}

// Default values
const DEFAULT_REGEX_FLAGS = 'gi';
const DEFAULT_JUMP_REGEXP = /\w{2,}/g;

export class Settings implements ExtensionComponent  {
    private decorationOptions: DecorationOptions;
    private codeOptions: Map<string, DecorationInstanceRenderOptions>;
    public codes: string[];
    public decorationType: TextEditorDecorationType;
    public wordRegexp: RegExp;

    public constructor () {
        this.decorationOptions = {};
        this.decorationType = window.createTextEditorDecorationType({});
        this.codeOptions = new Map();
        this.codes = [];
        this.wordRegexp = DEFAULT_JUMP_REGEXP;
    }

    public activate(): void {
        this.update();
    }

    public deactivate(): void {}

    public getOptions(code: string): DecorationInstanceRenderOptions {
        return this.codeOptions.get(code) as DecorationInstanceRenderOptions;
    }

    public update (): void {
        this.buildDecorationType();
        this.buildWordRegexp();
        this.buildCharset();
        this.buildCodeOptions();
    }

    public handleConfigurationChange (event: ConfigurationChangeEvent): boolean {
        if (event.affectsConfiguration(SettingNamespace.Jumpy)) {
            this.update();
            return true;
        } else if (event.affectsConfiguration(SettingNamespace.Editor)) {
            this.buildDecorationType();
            return true;
        } else {
            return false;
        }
    };

    private buildDecorationType(): void {
        const jumpyConfig = workspace.getConfiguration(SettingNamespace.Jumpy);
        const editorConfig = workspace.getConfiguration(SettingNamespace.Editor);

        const fontFamily: string =
            jumpyConfig[DisplaySetting.FontFamily] || editorConfig['fontFamily'];
        const fontSize: number =
            jumpyConfig[DisplaySetting.FontSize] || editorConfig['fontSize'];

        // TODO: Should have defaults in package.json
        const color = jumpyConfig.get<string>(DisplaySetting.Color);
        const backgroundColor = jumpyConfig.get<string>(DisplaySetting.BackgroundColor);
        // const outline = '';
        // const outlineColor = '';
        // const outlineStyle = '';
        // const outlineWidth = '';
        // const border = '';
        // const borderColor = '';
        // const borderRadius = '';
        // const borderSpacing = '';
        // const borderStyle = '';
        // const borderWidth = '';
        // const fontStyle = '';
        // const fontWeight = '';
        // const textDecoration = '';
        // const cursor = '';
        // const opacity = '';
        // const gutterIconPath = '';
        // const gutterIconSize = '';
        // const overviewRulerColor = '';

        // TODO: Should have defaults in package.json
        // const colorLight = jumpyConfig[Setting.ColorLight];
        // const backgroundLight = jumpyConfig[Setting.BackgroundLight];

        const options = {
            fontSize,
            fontFamily,
            color,
            backgroundColor,
            width: `${fontSize}px`,
            margin: `0 0 1px 0`,
        };

        this.decorationOptions = options;
        this.decorationType = window.createTextEditorDecorationType({ after: options });
    }

    private buildWordRegexp(): void {
        const jumpyConfig = workspace.getConfiguration(SettingNamespace.Jumpy);
        const userWordRegex = jumpyConfig[Setting.WordRegexp];

        if (userWordRegex != null && userWordRegex.length > 0) {
            const userWordRegexFlags = jumpyConfig[Setting.WordRegexpFlags] || DEFAULT_REGEX_FLAGS;
            this.wordRegexp = new RegExp(userWordRegex, userWordRegexFlags);
        }
    }

    private buildCharset(): void {
        const jumpyConfig = workspace.getConfiguration(SettingNamespace.Jumpy);
        const charsetSetting = jumpyConfig.get<string>(Setting.PrimaryCharset);
        const charset = charsetSetting && charsetSetting.length ? charsetSetting.split('') : undefined;
        this.codes = createCharCodeSet(charset);
    }

    private buildCodeOptions(): void {
        const settings = workspace.getConfiguration(SettingNamespace.Jumpy);
        const useIcons = Boolean(settings.get<boolean>(Setting.UseIcons));

        for (const code of this.codes) {
            this.codeOptions.set(code, this.createRenderOptions(useIcons, code));
        }
    }

    private createRenderOptions(useIcons: boolean, code: string): DecorationInstanceRenderOptions {
        const key = useIcons ? 'contentIconPath' : 'contentText';
        const value = useIcons ? this.createSVGIconUri(code) : code;

        return {
            dark: {
                after: {
                    [key]: value,
                },
            },
            light: {
                after: {
                    [key]: value,
                },
            },
        };
    }

    private createSVGIconUri (code: string): Uri {
        const { fontSize, background, fontFamily, color } = this.decorationOptions;
        const svg = `<svg viewBox="0 0 ${fontSize} ${fontSize}" height="${fontSize}" width="${fontSize}">
            <rect width="" height="" rx="2" ry="2" style="fill: ${background};"></rect>
            <text font-family="${fontFamily}" font-size="${fontSize}px" textLength="${fontSize}" textAdjust="spacing" fill="${color}" x="1" y="${fontSize}">${code}</text>
        </svg>`;
        return Uri.parse(`data:image/svg+xml;utf8,${svg}`);
    }
}

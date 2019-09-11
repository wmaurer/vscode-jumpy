import { commands, Uri } from 'vscode';
import { JumpPositionMap } from './ext_position';
import { ExtSettings } from './ext_settings';

interface UriCache {
    [k: string]: Uri;
}

export class ExtState {
    public codes: string[];
    public maxDecorations: number;
    public settings: ExtSettings;
    public positions: JumpPositionMap;
    public firstChar: string;
    public isInJumpMode: boolean;
    public uriCache: UriCache;

    constructor() {
        this.codes = this.buildCodes();
        this.maxDecorations = this.codes.length;
        this.settings = new ExtSettings();
        this.positions = {};
        this.firstChar = '';
        this.isInJumpMode = false;
        this.uriCache = this.buildCache();
    }

    public disableJumpMode(): this {
        this.isInJumpMode = false;
        this.firstChar = '';
        commands.executeCommand('setContext', 'jumpy.isJumpyMode', false);
        return this;
    }

    public enableJumpMode(): this {
        this.isInJumpMode = true;
        commands.executeCommand('setContext', 'jumpy.isJumpyMode', true);
        return this;
    }

    private buildCodes(): string[] {
        const codes: string[] = [];
        function combine(arrA: string[], arrB: string[]): void {
            for (let i = 0; i < arrA.length; i++) {
                for (let j = i; j < arrB.length; j++) {
                    codes.push(`${arrA[i]}${arrB[j]}`);
                }
            }
        }

        const sets = [
            ['q', 'w', 'e', 'a', 's', 'd', 'z', 'x', 'c'],
            ['p', 'o', 'i', 'l', 'k', 'j', 'm', 'n'],
            ['t', 'y', 'u', 'g', 'h', 'b'],
        ];

        for (const set of sets) {
            combine(set, set);
        }
        combine(sets[0], sets[1]);
        combine(sets[0], sets[2]);
        combine(sets[1], sets[2]);

        return codes;
    }

    public rebuildCache(): void {
        this.uriCache = this.buildCache();
    }

    private buildCache(): UriCache {
        const cache: UriCache = {};
        const {
            fontSize,
            fontFamily,
            backgroundColor,
            color,
            pad,
        } = this.settings.decorationConfig;
        const width = fontSize + pad;

        for (const code of this.codes) {
            const svg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${fontSize}" height="${fontSize}" width="${width}"><rect width="${width}" height="${fontSize}" rx="2" ry="2" style="fill: ${backgroundColor};"></rect><text font-family="${fontFamily}" font-size="${fontSize}px" textLength="${width}" lengthAdjust="spacing" fill="${color}" x="0" y="${fontSize -
                pad}">${code}</text></svg>`;
            cache[code] = Uri.parse(svg);
        }

        return cache;
    }
}

# Jumpy Extension for Visual Studio Code

## Feature Overview

Jumpy provides fast cursor movement, inspired by Atom's package of the same name.

![jumpy-preview](https://cloud.githubusercontent.com/assets/2899448/19660934/0481c44c-9a32-11e6-87cc-1f8913922ccb.gif)

## Commands

When Jumpy is activated, decorations (two-letter codes) are created in the area around your cursor. Then simply type in a two letter code to jump to that position.

Where the decorations are created is dependent on the command you use:

* `extension.jumpy-word` (Jumpy Word Mode): creates decorations for words in the area around your cursor
* `extension.jumpy-line` (Jumpy Line Mode): creates decorations for non-empty lines in the area around your cursor

No default keybindings have been provided with this extension to avoid conflicts. Instructions for setting up your own keybindings are [here](https://code.visualstudio.com/docs/customization/keybindings)

To exit `Jumpy mode`, press a non-`a-z` key such as `space` or `enter`.

To set up the keybindings like Atom (`Shift+Enter`), add the following to your `keybindings.json` (File -> Preferences -> Keyboard Shortcuts):

```
    {
        "key": "shift+enter",
        "command": "extension.jumpy-word",
        "when": "editorTextFocus"
    }
```

You can also set up a special keybinding to exit `Jumpy mode`, for example `ESC`:

```
    {
        "key": "Escape",
        "command": "extension.jumpy-exit",
        "when": "editorTextFocus && jumpy.isJumpyMode"
    }
```

## Settings

Jumpy settings can be configured by adding entries into your `settings.json` (File -> Preferences -> User Settings). The following settings are available:

`"jumpy.wordRegexp"`: The Regexp to use to match words in `Jumpy Word Mode`. The default is `"\\w{2,}"` which matches a string of characters `[A-Za-z0-9_]`, length two or more. To match individual words inside camel case, for example, override with `"([A-Z]+([0-9a-z])*)|[a-z0-9]{2,}"`.

`"jumpy.lineRegexp"`: The Regexp to use to match empty lines (Jumpy won't create decorations for empty lines). The default is `"^\\s*$"`

## Support

[Create an issue](https://github.com/wmaurer/vscode-jumpy/issues)

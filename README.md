# Jumpy Extension for Visual Studio Code

## Feature Overview

Jumpy provides fast cursor movement, inspired by Atom's package of the same name.

![jumpy-preview](https://media.giphy.com/media/W5fPqy6JMb7nSJSmH3/giphy.gif)

To set up the keybindings like Atom (`Shift+Enter`), add the following to your `keybindings.json` (File/Code -> Preferences -> Keyboard Shortcuts):

```
    {
        "key": "shift+enter",
        "command": "extension.jumpy-exit",
        "when": "editorTextFocus && jumpy.isInJumpMode"
    },
    {
        "key": "shift+enter",
        "command": "extension.jumpy-enter",
        "when": "editorTextFocus && !jumpy.isInJumpMode"
    }
```

You can also set up a special keybinding to exit `Jumpy mode`, for example `ESC`:

```
    {
        "key": "Escape",
        "command": "extension.jumpy-exit",
        "when": "editorTextFocus && jumpy.isInJumpMode"
    }
```

## Settings

Jumpy settings can be configured by adding entries into your `settings.json` (File -> Preferences -> User Settings). The following settings are available:

`"jumpy.wordRegexp"`: The Regexp to use to match words in `Jumpy Word Mode`. The default is `"\\w{2,}"` which matches a string of characters `[A-Za-z0-9_]`, length two or more. To match individual words inside camel case, for example, override with `"([A-Z]+([0-9a-z])*)|[a-z0-9]{2,}"`.

`"jumpy.wordRegexpFlags"`: The Regexp flags used when creating Regexp instance to match words.

`"jumpy.primaryCharset"`: Set of characters used to create jump key combinations. First letters will occur the closes to the current active line.

`"jumpy.useIcons"`: Defines whether markers should be rendered as flowing icons or prepending text.

`"jumpy.display.backgroundColor"`: Background of Jumpy decoration.

`"jumpy.display.color"`: Text color of Jumpy decoration.

## Support

[Create an issue](https://github.com/krnik/vscode-jumpy/issues)

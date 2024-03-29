# Close tool (ツールのクローズ)

The same functionality has been added to the official VSCode.
https://code.visualstudio.com/updates/v1_67#_bracket-pair-colorization-enabled-by-default

Some usability is different, but it works more stable than my script.
In other words... I would like to finish the development of this extension and leave the future development to VSCode official.

Thank you for using my tool.

[Japanese]

VSCodeの公式に、同じ機能が追されました。
https://code.visualstudio.com/updates/v1_67#_bracket-pair-colorization-enabled-by-default

一部使い勝手が違いますが、私のスクリプトより安定して動作します。
つまりは... この拡張機能の開発は終了し、今後の展開はVSCode公式に任せたいと思います。

私のツールを使っていただき、ありがとうございました。

---------------------------------

# Regex Highlighter README
* Japanese is [here](https://github.com/TatsuyaNakamori/vscode-RegexHighlighter/blob/master/README.jp.md).

## Overview

* Highlight a regular expression.


## New features (0.0.1)

* Apply a text background color according to the nesting depth of the round brackets.
* Display a warning color when the number of round brackets does not match.
* Other Release Notes: [CHANGELOG.md](https://github.com/TatsuyaNakamori/vscode-RegexHighlighter/blob/master/CHANGELOG.md)


## Donations

* [![GitHub Sponsor](https://github.com/sponsors/TatsuyaNakamori/button)](https://github.com/sponsors/TatsuyaNakamori)

  or

* [![paypal](https://www.paypalobjects.com/en_US/GB/i/btn/btn_subscribeCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=92TF7YW4SUBHS)


## How to use

* When you select a line of code with a regular expression in it, the background color will be applied according to the depth of nesting of the round brackets.
* Applied to strings enclosed in quotation marks (e.g. Python) or slashes (e.g. JavaScript)
* Does not interfere with the color theme text color applied in VSCode (only the background color is applied).<br>
![reg_color](resources/doc/reg_color1.png)

* If the number of round brackets does not match, an error message will be displayed.<br>
![reg_color](resources/doc/reg_color2.png)

* If you want to stop highlighting, select `right-click>"StoppingRegexhighlighting"`.
* If you want to resume highlighting, select `right-click>"ResumeRegexhighlighting"`.<br>
![reg_color](resources/doc/reg_contextMenu.png)


## Settings

* If you want to change the background color, you can set it from RegexHighlighter in Settings.<br>
![reg_color](resources/doc/reg_config.png)


## Known issues / future updates

* Currently, multi-line definitions are not supported (Python's "`re.X`", "`re.VERBOSE`"/ `(?x)` flags)
*  Please post your requests to [here](https://github.com/TatsuyaNakamori/vscode-RegexHighlighter/issues).

## License

* Copyright (c) 2021 Tatsuya Nakamori<br>
  MIT License

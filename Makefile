package:
	npm run package

install: package
	code --install-extension vscode-jumpy-0.3.2.vsix

uninstall:
	 code --uninstall-extension wmaurer.vscode-jumpy


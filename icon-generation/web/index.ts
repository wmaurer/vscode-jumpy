window.onload = () => {
    let dark = null;
    generateIcons('white', 'black')
        .then(result => {
            dark = result;
            return generateIcons('black', 'white');
        })
        .then(light => {
            console.log(JSON.stringify({ dark, light }));
        });
};

function generateIcons(backgroundColor: string, fontColor: string) {
    const body = document.getElementsByTagName('body')[0];
    let promises = [];

    const array = new Array(26).fill(null);
    array.forEach((_, i) => {
        array.forEach((_, j) => {
            const code = String.fromCharCode(97 + i) + String.fromCharCode(97 + j);
            const canvas = document.createElement('canvas');
            canvas.setAttribute('width', '14');
            canvas.setAttribute('height', '13');
            const ctx = canvas.getContext('2d');
            const img = document.createElement('img');
            const svg = getSvg(code, backgroundColor, fontColor);
            const svgEncoded = 'data:image/svg+xml;base64,' + btoa(svg);
            const promise = new Promise((resolve, reject) => {
                img.onload = () => {
                    ctx.drawImage(img, 0, 0);
                    resolve({
                        code,
                        pngEncoded: canvas.toDataURL('image/png')
                    })
                    img.style.margin = '5px';
                    body.appendChild(img);
                }
                img.setAttribute('src', svgEncoded);
            });
            promises = [...promises, promise];
        });
    });
    return Promise.all(promises);
}

function getSvg(code, backgroundColor: string, fontColor: string) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 13" height="13" width="14"><rect width="14" height="13" rx="2" ry="2" style="fill: ${backgroundColor};"></rect><text font-family="Consolas" font-size="10.5px" fill="${fontColor}" x="1" y="10">${code}</text></svg>`;
}

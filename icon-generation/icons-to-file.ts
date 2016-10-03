import * as fs from 'fs';
import * as bluebird from 'bluebird';

const readFile = bluebird.promisify(fs.readFile);
const writeFile = bluebird.promisify<void, string, string, string>(fs.writeFile);

readFile('./icon-generation/icons.json')
    .then(data => {
        const iconsSource = JSON.parse(data.toString());
        const strip = s => s.replace(/^data:image\/png;base64,/, '');
        const darkPromises = iconsSource.dark.map(x => writeFile(`./icon-generation/dark/${x.code}.png`, strip(x.pngEncoded), 'base64'));
        const lightPromises = iconsSource.light.map(x => writeFile(`./icon-generation/light/${x.code}.png`, strip(x.pngEncoded), 'base64'));
        return Promise.all([ ...darkPromises, ...lightPromises]);
    })
    .then(() => {
        console.log('done');
    });

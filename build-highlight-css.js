const fs = require('fs')
// const fse = require('fs-extra');
const nodePath = require('path');
const assert = require('assert');
const postcss = require('postcss');
const postcssParentSelector = require('postcss-parent-selector');

const STYLE_PATH = '/Users/s/sushuangwork/met/act/gitall/markdown-it-ss/node_modules/highlight.js/styles/devibeans.css';
const TARGET_DIR = '/Users/s/sushuangwork/met/act/gitall/markdown-it-ss/tpl/theme/mixu-page-ss/gen';

// { root: '/',
//   dir: '/home/user/dir',
//   base: 'file.txt',
//   ext: '.txt',
//   name: 'file' }
const stylePathParsed = nodePath.parse(STYLE_PATH);
assert(stylePathParsed.name);


async function run() {
    const styleFileContent = fs.readFileSync(STYLE_PATH, {encoding: 'utf8'});

    save('standalone', styleFileContent);

    const addCSSParentSelector = postcss([
        postcssParentSelector({
            selector: '.vscode-light'
        })
    ]);
    const cssResult = await addCSSParentSelector.process(styleFileContent, {from: undefined});
    save('vscode-light', cssResult.css);
}

function save(fileMiddleName, outputContent) {
    const outputPath = nodePath.join(TARGET_DIR, `${stylePathParsed.name}.${fileMiddleName}${stylePathParsed.ext}`);
    fs.writeFileSync(outputPath, outputContent);
}

run();

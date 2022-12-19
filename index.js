#!/usr/bin/env node

// --inspect --inspect-brk

const fs = require('fs')
// const fse = require('fs-extra');
const nodePath = require('path');
const assert = require('assert');
const hljs = require('highlight.js');
const markdownItAnchor = require('markdown-it-anchor');
const markdownItAnchorTOC = require('markdown-it-toc-done-right');

const CLI_RED_COLOR = '\033[0;31m';
const CLI_GREEN_COLOR = '\033[0;32m';
const CLI_CYAN_COLOR = '\033[0;36m';
const CLI_RESET_COLOR ='\033[0m';


const cmdArg = process.argv[2].trim();

if (cmdArg === '--help' || cmdArg === '-h') {
    printHelp();
    process.exit(0);
}

if (cmdArg === '--test') {
    SRC_PATH = nodePath.join(__dirname, 'test/test.md');
}
else {
    SRC_PATH = cmdArg;
}

if (!SRC_PATH) {
    console.error('Error: need to input src path');
    process.exit(1);
}

function printHelp() {
    console.log();
    console.log(`${CLI_CYAN_COLOR}[Usage]: ${CLI_RESET_COLOR}`);
    console.log();
    // ${toc}, [[toc]], [toc], [[_toc_]] are OK.
    console.log(`If you need TOC, please add ${CLI_CYAN_COLOR}[[toc]]${CLI_RESET_COLOR} in your markdown.`);
    console.log();
    console.log(`If you need video, convert mov to mp4 by ${CLI_CYAN_COLOR}ffmpegmov2mp4 assets/some.mov${CLI_RESET_COLOR}`);
    console.log();
    console.log(`If you need multiple images in a line:`);
    console.log(`${CLI_CYAN_COLOR}
<!-- Use image original width -->
<ul class="img-line">
    <li><img src="assets/my_img1.png"/></li>
    <li><img src="assets/my_img2.png"/></li>
</ul>
<!-- Adjust width by flex: number -->
<ul class="img-line">
    <li style="flex: 2"><img src="assets/my_img1.png"/></li>
    <li style="flex: 5"><img src="assets/my_img2.png"/></li>
</ul>
    ${CLI_RESET_COLOR}`);
}

console.log(`${CLI_GREEN_COLOR} src path: "${SRC_PATH}" ${CLI_RESET_COLOR}`);

const TPL_PATH = '/Users/s/sushuangwork/met/act/gitall/markdown-it-ss/tpl/index.tpl.html'
const STYLE_FILES = [
    '/Users/s/sushuangwork/met/act/gitall/markdown-it-ss/tpl/theme/mixu-page-ss/style.css', // ok
    '/Users/s/sushuangwork/met/act/gitall/markdown-it-ss/tpl/theme/mixu-page-ss/pilcrow.css', // ok
    // '/Users/s/sushuangwork/met/act/gitall/markdown-it-ss/node_modules/markdown-styles/tpl/theme/mixu-page/hljs-github.min.css',
    // '/Users/s/sushuangwork/met/act/gitall/markdown-it-ss/tpl/theme/vscode/markdown.css',
    // '/Users/s/sushuangwork/met/act/gitall/markdown-it-ss/node_modules/github-markdown-css/github-markdown.css',
    // '/Users/s/sushuangwork/met/act/gitall/markdown-it-ss/tpl/theme/github/markdown.css',
    // '/Users/s/sushuangwork/met/act/gitall/markdown-it-ss/tpl/theme/vscode/highlight.css',
    // '/Users/s/sushuangwork/met/act/gitall/markdown-it-ss/node_modules/highlight.js/styles/tomorrow-night-blue.css'
    // '/Users/s/sushuangwork/met/act/gitall/markdown-it-ss/node_modules/highlight.js/styles/stackoverflow-dark.css',
    // '/Users/s/sushuangwork/met/act/gitall/markdown-it-ss/node_modules/highlight.js/styles/a11y-dark.css',
    '/Users/s/sushuangwork/met/act/gitall/markdown-it-ss/tpl/theme/mixu-page-ss/gen/devibeans.standalone.css', // best
    // Code themes:
    // '/Users/s/sushuangwork/met/act/gitall/markdown-it-ss/node_modules/highlight.js/styles/devibeans.css', // best
    // '/Users/s/sushuangwork/met/act/gitall/markdown-it-ss/node_modules/highlight.js/styles/github-dark.css', // ok
    // '/Users/s/sushuangwork/met/act/gitall/markdown-it-ss/node_modules/highlight.js/styles/pojoaque.css', // ok
    // '/Users/s/sushuangwork/met/act/gitall/markdown-it-ss/node_modules/highlight.js/styles/stackoverflow-dark.css', // ok
    // '/Users/s/sushuangwork/met/act/gitall/markdown-it-ss/node_modules/highlight.js/styles/vs2015.css', // ok
    '/Users/s/sushuangwork/met/act/gitall/markdown-it-ss/tpl/theme/mixu-page-ss/custom.css',
];

// { root: '/',
//   dir: '/home/user/dir',
//   base: 'file.txt',
//   ext: '.txt',
//   name: 'file' }
const srcPathParsed = nodePath.parse(SRC_PATH);
assert(srcPathParsed.name);
const outputHTMLPath = nodePath.join(
    '/Users/s/sushuangwork/met/act/gitall/markdown-it-ss/output', srcPathParsed.name + '.html'
);

// full options list (defaults)
const md = require('markdown-it')({
    html:         true,        // Enable HTML tags in source
    // xhtmlOut:     false,        // Use '/' to close single tags (<br />).
    //                             // This is only for full CommonMark compatibility.
    breaks:       false,        // Convert '\n' in paragraphs into <br>
    langPrefix:   'language-',  // CSS language prefix for fenced blocks. Can be
                                // useful for external highlighters.
    linkify:      true,        // Autoconvert URL-like text to links

    // Enable some language-neutral replacement + quotes beautification
    // For the full list of replacements, see https://github.com/markdown-it/markdown-it/blob/master/lib/rules_core/replacements.js
    // typographer:  false,

    // Double + single quotes replacement pairs, when typographer enabled,
    // and smartquotes on. Could be either a String or an Array.
    //
    // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
    // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
    // quotes: '“”‘’',

    // Highlighter function. Should return escaped HTML,
    // or '' if the source string is not changed and should be escaped externally.
    // If result starts with <pre... internal wrapper is skipped.
    // highlight: function (/*str, lang*/) { return ''; }
    highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
            return '<pre class="hljs"><code>' +
                hljs.highlight(str, { language: lang }).value +
                '</code></pre>';
            // return hljs.highlight(str, { language: lang }).value;
        }
        return ''; // use external default escaping
    }
})
    // .use(pluginReplaceImageToDataURI)
    .use(markdownItAnchor, {
        permalink: true,
        permalinkBefore: true,
        permalinkSymbol: '§'
    })
    .use(markdownItAnchorTOC, {
        // min level
        level: 2
    });

function getAssetAbsPath(srcVal) {
    return nodePath.join(srcPathParsed.dir, srcVal);
}

function convertToDataURL(srcVal, mimeTypePart) {
    if (isDataURL(srcVal)) {
        return srcVal;
    }
    assert(mimeTypePart);
    const imgAbsPath = getAssetAbsPath(srcVal);
    const imgAbsPathParsed = nodePath.parse(imgAbsPath);
    assert(imgAbsPathParsed.ext, `Illegal image path "${imgAbsPath}"`);

    const contentsBase64 = fs.readFileSync(imgAbsPath, {encoding: 'base64'});
    return `data:${mimeTypePart}/${imgAbsPathParsed.ext.replace('.', '')};base64,${contentsBase64}`;
}

function isDataURL(srcVal) {
    return /^\s*data:/.test(srcVal);
}

function convertAllDataURLInHTMLTag(inputContent) {
    const tagReg = /<(video|VIDEO|img|IMG)[^>]+/g;
    const attrReg1 = /\s+src\s*=\s*"([^"]+)/g;
    const attrReg2 = /\s+src\s*=\s*'([^']+)/g;

    const mimeTypePartMap = {
        video: 'video',
        img: 'image'
    };

    return inputContent.replace(tagReg, function (allMatched, tagName) {
        const mimeTypePart = mimeTypePartMap[tagName.toLowerCase()];
        let result = allMatched;
        result = result.replace(attrReg1, function (_, srcVal) {
            return ` src="${convertToDataURL(srcVal, mimeTypePart)}`;
        });
        result = result.replace(attrReg2, function (_, srcVal) {
            return ` src='${convertToDataURL(srcVal, mimeTypePart)}`;
        });
        return result;
    });
}

// function pluginReplaceImageToDataURI(md, opt) {
//     md.core.ruler.after('inline', 'my-image-data-uri', function (state) {
//         state.tokens.forEach(function (blockToken) {
//             if (blockToken.type !== 'inline' || !blockToken.children) {
//                 return;
//             }
//             blockToken.children.forEach(function (token) {
//                 token.type === 'image' && token.attrs.forEach(function (attr) {
//                     if (attr[0] === 'src') {
//                         const srcVal = attr[1];
//                         attr[1] = convertToDataURL(srcVal, 'image');
//                     }
//                 });
//             });
//         });
//     });
// }

async function run() {
    const fileContent = fs.readFileSync(SRC_PATH, {encoding: 'utf8'});

    let body = md.render(fileContent);

    body = convertAllDataURLInHTMLTag(body);

    const tplContent = fs.readFileSync(TPL_PATH, {encoding: 'utf8'});
    let htmlContent = tplContent.replace('{{MARK_DOWN_IT_BODY}}', body);

    const styleContent = [];
    for (const styleFile of STYLE_FILES) {
        const styleFileContent = fs.readFileSync(styleFile, {encoding: 'utf8'});

        styleContent.push(styleFileContent);
    }
    htmlContent = htmlContent.replace('{{MARK_DOWN_IT_STYLE}}', styleContent.join('\n'));

    fs.writeFileSync(outputHTMLPath, htmlContent);

    console.log('Done');
    console.log('Please visit:');
    console.log(
        `${CLI_GREEN_COLOR} open ${outputHTMLPath} ${CLI_RESET_COLOR}`
    );
    console.log('HINTS:')
    console.log(`If you need help, please ${CLI_GREEN_COLOR}mditss --help${CLI_RESET_COLOR}`);
}

run();

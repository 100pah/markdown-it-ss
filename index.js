const fs = require('fs')
// const fse = require('fs-extra');
const nodePath = require('path');
const assert = require('assert');
const hljs = require('highlight.js');
const markdownItAnchor = require('markdown-it-anchor');
const markdownItAnchorTOC = require('markdown-it-toc-done-right');


/**
 * TOC: in md use one of:
 * ${toc}, [[toc]], [toc], [[_toc_]]
 */



const SRC_PATH = '/Users/s/sushuangwork/met/_NOTE/_TEXT_NOTE/_MAIN_/_baidu_work/baidu_mario_from_scratch.md';
const TPL_PATH = '/Users/s/sushuangwork/met/act/gitall/markdown-it-ss/tpl/index.tpl.html'
const STYLE_FILES = [
    // '/Users/s/sushuangwork/met/act/gitall/markdown-it-ss/node_modules/markdown-styles/layouts/github/assets/css/github-markdown.css',

    // '/Users/s/sushuangwork/met/act/gitall/markdown-it-ss/node_modules/markdown-styles/layouts/markedapp-byword/assets/style.css', // ok
    // '/Users/s/sushuangwork/met/act/gitall/markdown-it-ss/node_modules/markdown-styles/layouts/markedapp-byword/assets/pilcrow.css', // ok

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

    // Code themes:
    '/Users/s/sushuangwork/met/act/gitall/markdown-it-ss/node_modules/highlight.js/styles/devibeans.css', // best
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
            return '<pre class="hljs">' +
                hljs.highlight(str, { language: lang }).value +
                '</pre>';
            // return hljs.highlight(str, { language: lang }).value;
        }
        return ''; // use external default escaping
    }
})
    .use(pluginReplaceImageToDataURI)
    .use(markdownItAnchor, {
        permalink: true,
        permalinkBefore: true,
        permalinkSymbol: '§'
    })
    .use(markdownItAnchorTOC, {
        // min level
        level: 2
    });


function pluginReplaceImageToDataURI(md, opt) {
    md.core.ruler.after('inline', 'image-data-uri', function (state) {
        state.tokens.forEach(function (blockToken) {
            if (blockToken.type !== 'inline' || !blockToken.children) {
                return;
            }
            blockToken.children.forEach(function (token) {
                token.type === 'image' && token.attrs.forEach(function (attr) {
                    if (attr[0] === 'src') {
                        const srcVal = attr[1];
                        const imgAbsPath = nodePath.join(srcPathParsed.dir, srcVal);
                        const imgAbsPathParsed = nodePath.parse(imgAbsPath);
                        assert(imgAbsPathParsed.ext, `Illegal image path "${imgAbsPath}"`);

                        const contentsBase64 = fs.readFileSync(imgAbsPath, {encoding: 'base64'});
                        const datURI = `data:image/${imgAbsPathParsed.ext.replace('.', '')};base64,${contentsBase64}`;
                        attr[1] = datURI;
                    }
                });
            });
        });
    });
}

function pluginFindOutline(md, opt) {
    const outline = [];

    md.core.ruler.after('inline', 'find-outline', function (state) {
        let headingOpenToken;
        let headingTokens;
        for (let i = 0; i < state.tokens.length; i++) {
            token = state.tokens[i];
            if (token.type === 'heading_open') {
                headingOpenToken = token;
                headingTokens = [];
            }
            else if (token.type === 'heading_close') {
                addOutline(headingOpenToken, headingTokens);
            }
            else {
                headingTokens.push(token);
                headingTokens = null;
            }
        }
    });

    function addOutline(headingOpenToken, headingTokens) {
        if (!headingOpenToken || !headingTokens) {
            return;
        }
        for (const token of headingTokens) {
        }
    }
}


function run() {
    const fileContent = fs.readFileSync(SRC_PATH, {encoding: 'utf8'});

    const body = md.render(fileContent);

    const tplContent = fs.readFileSync(TPL_PATH, {encoding: 'utf8'});
    let htmlContent = tplContent.replace('{{MARK_DOWN_IT_BODY}}', body);

    const styleContent = [];
    for (const styleFile of STYLE_FILES) {
        styleContent.push(fs.readFileSync(styleFile, {encoding: 'utf8'}));
    }
    htmlContent = htmlContent.replace('{{MARK_DOWN_IT_STYLE}}', styleContent.join('\n'));

    fs.writeFileSync(outputHTMLPath, htmlContent);
}

run();

/*
    *  ------------------------  *
    *  -----  gulpfile.js -----  *
    *  ------------------------  *
*/


import { deleteAsync } from 'del';
import { src, dest, series, parallel } from 'gulp';
import terser from 'gulp-terser';
import cleanCSS from 'gulp-clean-css';
import htmlmin from 'gulp-htmlmin';
import plumber from 'gulp-plumber';
import fs from 'fs';



/**
 * ------------------------
 * -----  `Rutas`  --------
 * ------------------------
 * - Define las rutas de los archivos que participan en el build.
 */

const paths = {
    server: 'app.js',
    html: 'public/**/*.html',
    js: 'public/assets/js/**/*.js',
    css: 'public/assets/css/**/*.css',
    img: 'public/assets/img/**/*',
    packageJson: 'package.json'
};


//  -----  `Desestructuracion de rutas`  -----
const { server, html, js, css, img, packageJson } = paths;



/**
 * ---------------------------
 * -----  `cleanDist()`  -----
 * ---------------------------
 * - Elimina la carpeta dist/ y su contenido.
 */

export const cleanDist = () => deleteAsync(['dist']);



/**
 * ---------------------------
 * -----  `safePipe()`  ------
 * ---------------------------
 * - Evita que Gulp se detenga ante errores en las tareas.
 */

/**
 * @this {import('node:events').EventEmitter}
 * @param {Error} err
 */

const handlePipeError = function (err) {
    console.error(err.message);
    this.emit('end');
};

const safePipe = () => plumber({
    errorHandler: handlePipeError
});



/**
 * ------------------------------
 * -----  `minifyJsTask()`  -----
 * ------------------------------
 * - Minifica los scripts del frontend.
 * @param {() => void} done - Funcion callback para finalizar si no hay carpeta JS.
 */

export const minifyJsTask = (done) => {

    if (!fs.existsSync('public/assets/js'))
        return done();

    return src(js, { allowEmpty: true })
        .pipe(safePipe())
        .pipe(terser({ toplevel: true }))
        .pipe(dest('dist/public/assets/js'));
};



/**
 * -------------------------------
 * -----  `minifyCssTask()`  -----
 * -------------------------------
 * - Minifica los estilos del frontend.
 * @param {() => void} done - Funcion callback para finalizar si no hay carpeta CSS.
 */

export const minifyCssTask = (done) => {

    if (!fs.existsSync('public/assets/css'))
        return done();

    return src(css, { allowEmpty: true })
        .pipe(safePipe())
        .pipe(cleanCSS({ compatibility: 'ie8' }))
        .pipe(dest('dist/public/assets/css'));
};



/**
 * --------------------------------
 * -----  `minifyHtmlTask()`  -----
 * --------------------------------
 * - Minifica los archivos HTML del frontend.
 * @param {() => void} done - Funcion callback para finalizar si no hay carpeta public.
 */

export const minifyHtmlTask = (done) => {

    if (!fs.existsSync('public'))
        return done();

    return src(html, { allowEmpty: true })
        .pipe(safePipe())
        .pipe(htmlmin({
            collapseWhitespace: true,
            removeComments: true,
            removeOptionalTags: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            useShortDoctype: true,
            minifyCSS: true,
            minifyJS: true
        }))
        .pipe(dest('dist/public'));
};



/**
 * -----------------------------
 * -----  `copyImgTask()`  -----
 * -----------------------------
 * - Copia las imagenes del frontend.
 * @param {() => void} done - Funcion callback para finalizar si no hay carpeta de imagenes.
 */

export const copyImgTask = (done) => {

    if (!fs.existsSync('public/assets/img'))
        return done();

    return src(img, { allowEmpty: true, encoding: false })
        .pipe(safePipe())
        .pipe(dest('dist/public/assets/img'));
};



/**
 * --------------------------------
 * -----  `copyServerTask()`  -----
 * --------------------------------
 * - Copia el backend Express al directorio dist.
 */

export const copyServerTask = () =>

    src(server, { allowEmpty: true })
        .pipe(safePipe())
        .pipe(dest('dist'));



/**
 * -------------------------------------------
 * -----  `buildProductionPackageJson()`  -----
 * -------------------------------------------
 * - Genera un package.json minimo para ejecutar el backend desde dist.
 * @param {Record<string, any>} rootPackageJson - package.json original del proyecto.
 * @returns {Record<string, any>} - package.json listo para produccion.
 */

const buildProductionPackageJson = (rootPackageJson) => ({
    name: rootPackageJson.name,
    version: rootPackageJson.version,
    description: rootPackageJson.description,
    main: 'app.js',
    type: rootPackageJson.type,
    scripts: {
        start: 'node app.js'
    },
    keywords: rootPackageJson.keywords,
    author: rootPackageJson.author,
    license: rootPackageJson.license,
    dependencies: rootPackageJson.dependencies,
    ...(rootPackageJson.engines ? { engines: rootPackageJson.engines } : {})
});



/**
 * ---------------------------------
 * -----  `copyPackageTask()`  -----
 * ---------------------------------
 * - Genera y copia el package.json de runtime dentro de dist.
 */

export const copyPackageTask = async () => {

    if (!fs.existsSync(packageJson))
        return;

    const packageJsonContent = await fs.promises.readFile(packageJson, 'utf8');
    const rootPackageJson = JSON.parse(packageJsonContent);
    const productionPackageJson = buildProductionPackageJson(rootPackageJson);

    await fs.promises.mkdir('dist', { recursive: true });
    await fs.promises.writeFile(
        'dist/package.json',
        `${JSON.stringify(productionPackageJson, null, 2)}\n`
    );
};



/**
 * -----------------------
 * -----  `build()`  -----
 * -----------------------
 * - Limpia la carpeta dist.
 * - Optimiza el frontend y copia el backend listo para produccion.
 */

export const build = series(
    cleanDist,
    parallel(
        minifyJsTask,
        minifyCssTask,
        minifyHtmlTask,
        copyImgTask,
        copyServerTask,
        copyPackageTask
    )
);


export default build;
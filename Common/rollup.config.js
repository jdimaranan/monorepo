import { babel } from '@rollup/plugin-babel';
import typescript from 'rollup-plugin-typescript2';
import bundleScss from 'rollup-plugin-bundle-scss';
import copy from 'rollup-plugin-copy';
import generatePackageJson from 'rollup-plugin-generate-package-json';
import packageJson from './package.json' assert { type: 'json' };
import fs from 'fs';

// Gets the folders which we want to build as sub-modules
const getFolders = (entry) => {
  const dirs = fs.readdirSync(entry);
  const exclude = [];
  const dirsWithoutIndex = dirs
    .filter((name) => name !== 'index.ts')
    .filter((name) => !exclude.includes(name));
  return dirsWithoutIndex;
};

// Recursively fetch the files we want to include for compilation, gives us the flexibility for excluding certain file types
const getFiles = (entry, extensions = [], excludeExtensions = []) => {
  let fileNames = [];
  const dirs = fs.readdirSync(entry);
  dirs.forEach((dir) => {
    const path = `${entry}/${dir}`;

    if (fs.lstatSync(path).isDirectory()) {
      fileNames = [
        ...fileNames,
        ...getFiles(path, extensions, excludeExtensions),
      ];

      return;
    }

    if (
      !excludeExtensions.some((exclude) => dir.endsWith(exclude)) &&
      extensions.some((ext) => dir.endsWith(ext))
    ) {
      fileNames.push(path);
    }
  });
  return fileNames;
};

// The plugins we will include in all compilations
const plugins = [
  babel({
    exclude: 'node_modules/**',
    presets: ['@babel/preset-react'],
    babelHelpers: 'bundled',
  }),
  typescript({
    tsconfig: './tsconfig.json',
    useTsconfigDeclarationDir: true,
  }),
];

// We want to generate a custom package.json for each "sub-module" so it can be imported
const subfolderPlugins = (folderName) => [
  ...plugins,
  generatePackageJson({
    baseContents: {
      name: `${packageJson.name}/${folderName}`,
      private: true,
      type: 'module',
      main: './index.js',
      module: './index.js',
      types: './index.d.ts',
      typings: './index.d.ts',
    },
  }),
];

// Generate the build config for each of our subfolders
const folderBuilds = getFolders('./src').map((folder) => {
  return {
    input: `src/${folder}/index.ts`,
    output: {
      file: `dist/${folder}/index.js`,
      sourcemap: true,
      exports: 'named',
      format: 'esm',
    },
    plugins: [...plugins],
    external: ['react', 'react-dom'],
  };
});

// main build script which will trigger the builds of all of the sub modules too
export default [
  {
    input: './src/index.ts',
    output: {
      file: packageJson.module,
      format: 'esm',
      exports: 'named',
      sourcemap: true,
      name: 'common-library',
    },

    plugins: [
      ...plugins,
      generatePackageJson({
        baseContents: ({
          name,
          version,
          author,
          license,
          main,
          module,
          types,
          typings,
        }) => ({
          name: name.replace('-src', ''),
          version,
          private: true,
          author,
          license,
          type: 'module',
          main: main.replace('./dist', '.'),
          module: module.replace('./dist', '.'),
          types: types.replace('./dist', '.'),
          typings: typings.replace('./dist', '.'),
        }),
      }),
    ],
  },
  ...folderBuilds,
];

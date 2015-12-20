# EgoJS

A small utility to check your projects stats on [GitHub](https://github.com) and [npm](https://www.npmjs.com/).

[![Build Status](https://travis-ci.org/homer0/egojs.svg?branch=master)](https://travis-ci.org/homer0/egojs) [![Coverage Status](https://coveralls.io/repos/homer0/egojs/badge.svg?branch=master&service=github)](https://coveralls.io/github/homer0/egojs?branch=master) [![Documentation Status](https://doc.esdoc.org/github.com/homer0/egojs/badge.svg)](https://doc.esdoc.org/github.com/homer0/egojs/) [![Dependencies status](https://david-dm.org/homer0/egojs.svg)](https://david-dm.org/homer0/egojs) [![Dev dependencies status](https://david-dm.org/homer0/egojs/dev-status.svg)](https://david-dm.org/homer0/egojs#info=devDependencies)

Yes, it's all about the community and we only care about the contribution, but come on, you like when you see big number on the downloads counter, or that a lot of people forked/favorited your repo. Well, this is a small utility that allows you to register your projects and check their stats all together right from the terminal.

## Information

| -            | -                                                                |
|--------------|------------------------------------------------------------------|
| Package      | egojs                                                            |
| Description  | Check your project stats on GitHub and npm from the terminal.    |
| Node Version | >= v0.12.6 (You need >= v4.0.0 for the tests)                    |

## Installation

You can install it using [npm](https://www.npmjs.com/).

    npm install egojs -g
    
## Usage

### Configuration

    egojs config
    
You can start the configuration with the `config` command or by running **anything** for the first time :P. For now, the configuration only asks you for one thing: A GitHub access token. We need it in order to request for your repository information on their API.

You can generate a new GitHub access token [using this URL](https://github.com/settings/tokens/new).

### Add a package

    egojs add

Package is the way EgoJS identifies your projects, and they have three properties the app will ask you for:

- **Name**: This doesn't have to match anywhere, it's just a reference name for the database.
- **Repository**: A short version of your GitHub repository URL: `username/project`.
- **npm package**: The name of your project on npm.

Now, something to have in mind is that you can ignore the repository or the npm package, but not both.

### Edit a package

    egojs edit <id>
    
You can easily edit a package properties by using the `edit` command. You can obtain the package unique id from the first column of the table (see the `list` command).

### Remove a package

    egojs remove <id>
    
Removing packages it's as easy as editing them, instad of `edit`, use the `remove` command with the unique id you obtained from the table and your package goes away!.

### Show me the numbers!

    egojs list
    
This is the command you were looking for... It will show the table with your project stats. This is also executed if you didn't specify any command.

## As a module

I coded EgoJS so the CLI interface will consume a module that can be also used by other tools:

```javascript
const EgoJS = require('egojs');

const inst = new EgoJS();
inst.setGitHubToken('abc');
inst.addPackage('Rosario', 'homer0/Rosario', 'charito')
.then((pkg) => {
	console.log(pkg.name, ' was successfully added!');
});
```

For more information, you can check the [EgoJS module documentation](https://doc.esdoc.org/github.com/homer0/egojs/class/src/egojs.js~EgoJS.html).

## Development

### Install Git hooks

    ./hooks/install

### npm tasks

- `npm run build`: Build the module to be ES5 compatible (using [Babel](https://babel.io)).
- `npm test`: Run the module's unit tests.
- `npm run coverage`: Run the unit tests and open the coverage report on the browser.
- `npm run lint`: Lint the plugin's code with JSCS and ESLint.
- `npm run docs`: Generate the project documentation.

## License

MIT. [License file](./LICENSE).
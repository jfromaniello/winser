# WinSer

  Run node.js applications as windows services using [nssm](http://nssm.cc).

## Installation

    $ npm install winser

## Command line arguments

    -v, --version                 show vinser version and exit
    -a, --autostart               start the application immediately after installation
    -i, --install                 install the node application as a windows service
    -r, --remove                  remove the windows service for the node application
    -x, --stop                    stop the service before uninstalling
    -s, --silent                  supress any information in the console
    -c, --confirmation            ask for confirmation before installing/uninstalling
    -p, --path <ARG1>             path to the node application you want to install as a service (current path by default)
    -n, --name <ARG1>             name for service (default: name from package.json)
    -d, --description <ARG1>      service description (default: description from package.json)
    --displayname <ARG1>          display name for service
    --startcmd <ARG1>             use this command for start service (default: scripts.start from package.json)
    --startuptype <ARG1>          set service startup type on boot (auto|manual|delayed|disabled) ("auto" by default)
    --env <ARG1>                  propogate environment variable (multiple)
    --startwithnpm                use "npm start" as a startcmd
    --set <ARG1>                  call nssm "set" command with arguments (multiple)

## Method 1

I really like this method, in the package.json:

```js
  "scripts": {
    "postinstall": "winser -i -s -c",
    "preuninstall": "winser -r -x -s",
  }
```

Then, in order to install a node application in lets say a server I will do this:

```bash
  npm install git://github.com/myprivate/repository/url.git
```

The arguments in the **postinstall** script means:

-  i install
-  s silent, don't display any information
-  c ask for confirmation. This is very helpfull because during development you don't want to install/uninstall the package as a windows service but you will often run "npm install" in the folder, then you can cancel with an 'n'.

The arguments in the **preuninstall** script means:

-  x stop the service before uninstalling
-  r remove the service
-  s silent, don't display any information


## Method 2

Add these two scripts to your package.json:

```js
  "scripts": {
    "install-windows-service": "winser -i",
    "uninstall-windows-service": "winser -r"
  }
```

Then you can install your service as:

```bash
  npm run-script install-windows-service
```

## How it works

When you install your node.js program as a windows service, your program is registered using nssm.exe (which is inside the module folder). Once you start the service nssm.exe is run and nssm.exe will execute start command.

Start command may be:
 - npm "start" action from package.json.
 - "node <main>", where <main> is a main section in package.json.
 - command provided by "--startcmd <command>" option.

Remember that the default npm action for "start" is "node server.js".

The name of the service will be the same from your package.json "name" setting.

## Credits

This project is heavily inspired in 

 - [Node.js on windows by Tatham Oddie](http://blog.tatham.oddie.com.au/2011/03/16/node-js-on-windows/)

And it uses:

 - [nssm](http://nssm.cc)

## License 

(The MIT License)

Copyright (c) 2011 Jose Romaniello &lt;jfromaniello@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
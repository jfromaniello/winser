# WinSer

  Run node.js applications as windows services using [nssm](http://nssm.cc).

## Installation

    $ npm install winser

Warning: you need node v0.6.11 or above and this package only will works on win32 platforms.

## Package.json

Add these two scripts to your package.json:

```js
  "scripts": {
    "install-windows-service": "node_modules\\.bin\\winser -i",
    "uninstall-windows-service": "node_modules\\.bin\\winser -r"
  }
```

Then you can install your service as:

```bash
  npm run-script install-windows-service
```

## How it works

When you install your node.js program as a windows service, your program is registered using nssm.exe (which is inside the module folder). Once you start the service nssm.exe is run and nssm.exe will execute "npm start" of your application.

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
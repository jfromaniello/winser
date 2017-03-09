
var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;
var assign = require('object-assign');
var async = require('async');
var packageJson = require('./package.json');

function Winser (opts) {
    var options = opts || {};

    if (!(this instanceof Winser)) {
        return new Winser(options);
    }

    options = {
        path: options.path || process.cwd(),
        nssmPath: options.nssmPath || undefined,
        app: options.app || undefined,
        silent: options.silent || false,
        startwithnpm: false,
        startcmd: undefined,
        startuptype: 'auto',
        stop: false,
        autostart: false
    };

    this._options = options;

    this.log = function log(message) {
        !options.silent && console.log(message);
    };

    this.version = packageJson.version;
};

Winser.prototype.install = function install(localOpts, cb) {
    var self = this;
    var args = Array.prototype.slice.call(arguments);
    var appInfo;
    var autostart;

    var options = assign({}, self._options);

    if (localOpts && localOpts.path != null) {
        options.path = localOpts.path;
    }

    if (localOpts && localOpts.startwithnpm != null) {
        options.startwithnpm = localOpts.startwithnpm;
    }

    if (args.length === 1) {
      cb = localOpts;
      autostart = options.autostart;
    } else {
        if (localOpts && localOpts.autostart != null) {
            autostart = localOpts.autostart;
        } else {
            autostart = options.autostart;
        }
    }

    async.waterfall([
        function(next) {
            checkRequerimentsAndApplyDefaults('install', options, next);
        },
        function(opts, next) {
            var startcmd;
            var startuptype;

            options = opts;

            getAppInfoFromPkgOrOptions(options, {
                path: localOpts && localOpts.path,
                name: localOpts && localOpts.name,
                displayname: localOpts && localOpts.displayname,
                description: localOpts && localOpts.description,
                startwithnpm: localOpts && localOpts.startwithnpm,
                startcmd: localOpts && localOpts.startcmd,
                startuptype: localOpts && localOpts.startuptype
            }, next);
        },
        function(info, next) {
            appInfo = info;

            if (!appInfo.path) {
                return next(new Error('No path provided!'));
            }

            if (!appInfo.name) {
                return next(new Error('No name provided!'));
            }

            if (!appInfo.startcmd) {
                return next(new Error('No start command provided!'));
            }

            self.log('Use start command "' + appInfo.startcmd + '".');

            nssmExec(options.nssmPath, 'install', appInfo.name, appInfo.startcmd, options.silent, function(error) {
                if (error) {
                    return next(error);
                }

                self.log('The program "' + appInfo.name + '" was installed as a service.');
                next();
            });
        },
        function(next) {
            nssmExec(options.nssmPath, 'set', appInfo.name, 'AppDirectory "' + appInfo.path + '"', options.silent, function(error) {
                if (error) {
                    return next(new Error('Can\'t set startup folder (' + appInfo.path + ') for service'));
                }

                next();
            });
        },
        function(next) {
            if (!appInfo.description) {
                return next();
            }

            nssmExec(options.nssmPath, 'set', appInfo.name, 'Description "' + appInfo.description + '"', options.silent, function(error) {
                if (error) {
                    return next(new Error('Can\'t set description for service'));
                }

                next();
            });
        },
        function(next) {
            if (!appInfo.displayname) {
                return next();
            }

            nssmExec(options.nssmPath, 'set', appInfo.name, 'DisplayName "' + appInfo.displayname + '"', options.silent, function(error) {
                if (error) {
                    return next(new Error('Can\'t set display name for service'));
                }

                next();
            });
        },
        function(next) {
            nssmExec(options.nssmPath, 'set', appInfo.name, 'Start ' + getStartupType(appInfo.startuptype), options.silent, function(error) {
                if (error) {
                    return next(new Error('Can\'t set startup type for service'));
                }

                next();
            });
        },
        function(next) {
            var envs;

            if (localOpts && localOpts.env && localOpts.env.length > 0) {
                envs = Array.isArray(localOpts.env) ? localOpts.env.join(' ') : localOpts.env;

                nssmExec(options.nssmPath, 'set', appInfo.name, 'AppEnvironmentExtra ' + envs, options.silent, function(error) {
                    if (error) {
                        return next(new Error('Can\'t set environment for service'));
                    }

                    next();
                });

                return;
            } else {
                next();
            }
        },
        function(next) {
            var setOpts

            if (!localOpts || !localOpts.set || localOpts.set.length === 0) {
                return next();
            }

            if (typeof localOpts.set === 'string') {
                setOpts = [localOpts.set]
            } else {
                setOpts = localOpts.set
            }

            async.each(setOpts, function(arg, callback) {
                nssmExec(options.nssmPath, 'set', appInfo.name, arg, options.silent, function(error) {
                  if (error) {
                      return callback(new Error('Set operation failed (' + arg + ')'));
                  }

                  callback();
                });
            }, function(error) {
                if (error) {
                    return next(error);
                }

                next();
            })
        },
        function(next) {
            if (!autostart) {
                return next();
            }

            nssmExec(options.nssmPath, 'start', appInfo.name, null, options.silent, function(error) {
                if (error) {
                    return next(error);
                }

                self.log('The service for "' + appInfo.name + '" was started.');
                next();
            });
        }
    ], cb);
};

Winser.prototype.remove = function remove(localOpts, cb) {
    var self = this;
    var options = assign({}, self._options);
    var args = Array.prototype.slice.call(arguments);
    var appInfo;
    var stop;

    if (localOpts && localOpts.path != null) {
        options.path = localOpts.path;
    }

    if (args.length === 1) {
        cb = localOpts;
        stop = options.stop
    } else {
        if (localOpts && localOpts.stop != null) {
            stop = localOpts.stop
        } else {
            stop = options.stop
        }
    }

    async.waterfall([
        function(next) {
            checkRequerimentsAndApplyDefaults('remove', options, next);
        },
        function(opts, next) {
            options = opts;

            getAppInfoFromPkgOrOptions(options, {
              name: localOpts && localOpts.name
            }, next);
        },
        function(info, next) {
            appInfo = info;

            if (!appInfo.name) {
                return next(new Error('No name provided!'));
            }

            if (!stop) {
                return next();
            }

            exec(
                options.nssmPath + ' status "' + appInfo.name + '"',
                function(err, stdout, stderr) {
                    if (!err && !stderr){
                        var result = stdout.replace(/\0/gi, "").split("\r\n")[0];

                        if (result === "SERVICE_STOPPED") {
                            next();
                        } else {
                            nssmExec(options.nssmPath, 'stop', appInfo.name, null, options.silent, function() {
                                next();
                            });
                        }

                        return;
                    }

                    next(err || (stderr ? new Error(stderr) : null));
                }
            );
        },
        function(next) {
            nssmExec(options.nssmPath, 'remove', appInfo.name, 'confirm', options.silent, function(error) {
                if (error) {
                    return next(error);
                }

                self.log('The service for "' + appInfo.name + '" was removed.');
                next();
            });
        }
    ], cb);
}

Winser.prototype.getAppInfo = function getAppInfo(localOpts, cb) {
    var options = this._options;
    var args = Array.prototype.slice.call(arguments);

    if (args.length === 1) {
        cb = localOpts;
        localOpts = undefined;
    }

    getAppInfoFromPkgOrOptions(options, {
        path: localOpts && localOpts.path,
        name: localOpts && localOpts.name,
        displayname: localOpts && localOpts.displayname,
        description: localOpts && localOpts.description,
        startwithnpm: localOpts && localOpts.startwithnpm,
        startcmd: localOpts && localOpts.startcmd,
        startuptype: localOpts && localOpts.startuptype
    }, cb);
}

Winser.prototype.setSilent = function setSilent(silent) {
    this._options.silent = silent;
}

function checkRequerimentsAndApplyDefaults(action, opts, cb) {
    var options = opts || {};

    async.series([
        function(next) {
            if (process.platform !== 'win32') {
                return next(new Error('Winser can only install services on windows.'));
            }

            next()
        },
        function(next) {
            exec('NET SESSION', function(err, stdout, stderr) {
                if (err || stderr.length !== 0) {
                    return next(new Error('No rights to manage services.'));
                }

                next();
            });
        },
        function(next) {
            if (options.app) {
                return next();
            }

            if (!options.path) {
                return next(new Error('No path provided!'));
            }

            if (!(fs.existsSync || path.existsSync)(path.join(options.path, "package.json"))) {
                return next(new Error('"' + options.path + '" doesn\'t seems to be a node application path.\nIt doesn\'t contains a package.json file.'));
            }

            next();
        },
        function(next) {
            if (action === 'install' && options.startwithnpm) {
                exec('where npm.cmd', function(error, stdout) {
                    if (error !== null) {
                        return next(new Error('Can\'t find npm...'));
                    }

                    next();
                });

                return;
            }

            next();
        },
        function(next) {
            if (options.nssmPath) {
                options.nssmPath = '"' + options.nssmPath + '"';
                return next();
            }

            exec('wmic CPU get AddressWidth < nul', function(err, stdout) {
                var arch = '32';

                if (!err && stdout) {
                    arch = stdout.match(/(32|64)/)[1];
                }

                options.nssmPath = '"' + path.join(__dirname, './bin', (arch === '64') ? 'nssm64.exe' : 'nssm.exe') + '"';
                next();
            });
        }
    ], function (error) {
        cb(error, options);
    });
}

function getAppInfoFromPkgOrOptions(options, localOptions, cb) {
    var appPackage;
    var appPath;
    var appInfo = options.app;
    var info = {};
    var startwithnpm;
    var startcmd;
    var startuptype;

    if (localOptions && localOptions.path) {
        appPath = localOptions.path;
    } else if (appInfo && appInfo.path) {
        appPath = appInfo.path;
    } else {
        appPath = options.path;
    }

    startwithnpm = (localOptions && localOptions.startwithnpm) || (appInfo && appInfo.startwithnpm) || (options.startwithnpm);

    if (startwithnpm) {
        startcmd = 'npm start';
    } else {
        if (localOptions && localOptions.startcmd) {
            startcmd = localOptions.startcmd;
        } else if (appInfo && appInfo.startcmd) {
            startcmd = appInfo.startcmd;
        } else {
            startcmd = options.startcmd;
        }
    }

    if (localOptions && localOptions.startuptype) {
        startuptype = localOptions.startuptype;
    } else if (appInfo && appInfo.startuptype) {
        startuptype = appInfo.startuptype;
    } else {
        startuptype = options.startuptype;
    }

    info.path = appPath;
    info.startcmd = startcmd;
    info.startuptype = startcmd;

    if (appInfo) {
        info.name = appInfo.name;
        info.displayname = appInfo.displayname;
        info.description = appInfo.description;
    } else {
        try {
            appPackage = require(path.join(appPath, 'package.json'));

            info.name = appPackage.name;
            info.description = appPackage.description;

            if (!info.startcmd) {
                try {
                    info.startcmd = appPackage.scripts.start;
                } catch (e) {}

                if (!info.startcmd) {
                    info.startcmd = 'node ' + appPackage.main;
                }
            }
        } catch (e) {
            return cb(e);
        }
    }

    // localOptions have more priority
    if (localOptions) {
        if (localOptions.name) {
            info.name = localOptions.name;
        }

        if (localOptions.displayname) {
            info.displayname = localOptions.displayname;
        }

        if (localOptions.description) {
            info.description = localOptions.description;
        }
    }

    cb(null, info);
}

function getStartupType(startuptype) {
    switch (startuptype) {
        case "auto":
            return "SERVICE_AUTO_START";
        case "delayed":
            return "SERVICE_DELAYED_AUTO_START";
        case "manual":
            return "SERVICE_DEMAND_START";
        case "disabled":
            return "SERVICE_DISABLED";
        default:
            return "SERVICE_AUTO_START";
    }
}

function nssmExec(nssmPath, command, serviceName, arguments, silent, callback) {
    if (arguments === null) {
        arguments = '';
    }

    exec(
        nssmPath + ' ' + command + ' "' + serviceName + '" ' + arguments,
        function(err, stdout, stderr) {
            if (stderr){
                !silent && console.error(stderr);
            }

            callback(err || (stderr ? new Error(stderr) : null));
        }
    );
}

module.exports = Winser();
module.exports.Winser = Winser;
module.exports.version = packageJson.version;

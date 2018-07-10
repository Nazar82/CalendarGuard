const config = require('./build.config'),
    gulp = require('gulp'),
    childProcess = require('child_process'),
    runSequence = require('run-sequence'),
    nodemon = require('gulp-nodemon'),
    exec = childProcess.exec;

const runCommand = function (command) {
    exec(command, (err, stdout, stderr) => {
        console.log(stdout);
        console.log(stderr);
        if (err !== null) {
            console.log('exec error: ' + err);
        }
    });
};

gulp.task('start-all', () => {
    runSequence('start-mongo', 'prepareDB', 'backend');
});

gulp.task('start-mongo', (done) => {
    console.log('start-mongo');

    childProcess.spawn('mongod.exe', ['--port', '81', '--dbpath', __dirname + '\\db'], {
        cwd: config.mongo_dir,
        stdio: 'inherit'
    });

    setTimeout(() => {
        console.log('start-mongo completed');
        done();
    }, 5000);
});

gulp.task('stop-mongo', () => {
    runCommand('mongo --port 81 --eval "db.getSiblingDB(\'admin\').shutdownServer();"');
});

gulp.task('prepareDB', (done) => {
    exec('node prepareDB.js', () => {
        done();
    });
});

gulp.task('frontend', (done) => {
    exec('npm start', {
        cwd: 'frontend',
        stdio: 'inherit'
    });
    done();
});

gulp.task('backend', (done) => {
    nodemon({
        cwd: 'backend',
        script: './server.js',
    });
    done();
});


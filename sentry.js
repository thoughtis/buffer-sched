const conf = require( './config/' );
let sentry;


function captureException( err ) {
	console.error( err.message );
}

if ( true === conf.sentry.active ) {

	sentry = require( 'raven' );

	sentry.config( conf.sentry.dsn ).install();

} else {

	sentry = {captureException};

}

module.exports = sentry;

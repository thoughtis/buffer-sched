const conf 		= require( './config/' );
const sentry 	= require( 'raven' ); 

sentry.config( conf.sentry.dsn ).install();

module.exports = sentry;
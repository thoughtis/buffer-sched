const url = require( 'url' );
const untrailingslashit = require( './untrailingslashit' );

/**
 * Find Post Slug
 * Make sure its a Thought Catalog link, then pop the slug from the path
 * @param string link
 * @return boolean
 */
module.exports = ( link ) => {

	const url_parts = url.parse( link );

	if ( 'thoughtcatalog.com' !== url_parts.hostname ) {
		throw new Error( `Not a Thought Catalog URL.` )
	}

	const post_slug = untrailingslashit( url_parts.pathname ).split( '/' ).pop();

	if ( 'string' !== typeof post_slug ) {

		throw new Error( `Unusable value for post slug: ${post_slug}` );

	}

	return post_slug;

}
import pkg from '../package.json' with { type: 'json' };

export const VERSION: string = pkg.version;
export const LARAVEL_COLLECTION_VERSION: string = pkg.laravelCollectionVersion;

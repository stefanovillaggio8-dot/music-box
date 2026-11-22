'use strict';
// Execute the owning application's manifest validation and catalog merge.
// Metadata-only audit helper: no network, writes or library mutations.
function publishedCatalog(app,builtin,data){
 if(!Array.isArray(data))throw Error('Expected published imports array');
 const start=app.indexOf('_ytOnlineCache=data.filter('),end=app.indexOf('return _ytOnlineCache;',start);
 const mergeStart=app.indexOf('const builtin = BUILTIN.concat('),mergeEnd=app.indexOf('.filter((b) => !_branoEliminato(',mergeStart);
 if(start<0||end<start||mergeStart<0||mergeEnd<mergeStart)throw Error('Missing application import rules');
 // Text repair affects display only; exact file/profile validation remains
 // the application code, including untrusted filename rejection.
 const validate=new Function('data','_riparaTestoMetadati','let _ytOnlineCache;'+app.slice(start,end)+'return _ytOnlineCache;');
 const published=validate(data,x=>x);
 const expression=app.slice(mergeStart,mergeEnd).replace('const builtin = ','return ')
  .replace('(await _braniYouTubePubblicati(forceRemote))','published');
 if(expression.includes('await '))throw Error('Unrecognized application catalog merge');
 return new Function('BUILTIN','published','DEFAULT_PROFILE',expression+';')(builtin,published,'Ste');
}
module.exports={publishedCatalog};

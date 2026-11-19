/* Explicitly preview-only Firebase channel publish for V255 QA.
 * Never run firebase deploy or target 'live'. Never log credentials.
 */
import {writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const original=(process.env.FIREBASE_SERVICE_ACCOUNT_GTA6MAPA||'').trim();
if(!original)throw Error('FIREBASE_SERVICE_ACCOUNT_GTA6MAPA missing; no release attempted');
const options=[original];
const compact=original.replace(/\s+/g,'');
if(compact.length>100&&/^[A-Za-z0-9+/_=-]+$/.test(compact)){
 try{options.push(Buffer.from(compact.replace(/-/g,'+').replace(/_/g,'/'),'base64').toString('utf8'))}catch{}
}
let credential=null;
for(const candidate of options){
 try{
  let value=JSON.parse(candidate);
  if(typeof value==='string')value=JSON.parse(value);
  if(value?.type==='service_account'&&value.project_id==='gta6mapa'&&
      typeof value.client_email==='string'&&typeof value.private_key==='string'){credential=value;break}
 }catch{}
}
if(!credential&&original.startsWith('-----BEGIN PRIVATE KEY-----')){
 const key=original.replace(/\\n/g,'\n').replace(/\r/g,'').trim()+'\n';
 if(!key.includes('-----END PRIVATE KEY-----'))throw Error('Incomplete service-account key');
 credential={type:'service_account',project_id:'gta6mapa',
  private_key_id:'ef791aeb03ac62a7e130c54d0fc15527057062ef',
  private_key:key,
  client_email:'github-action-1445078769@gta6mapa.iam.gserviceaccount.com',
  client_id:'117668602201494757061',
  auth_uri:'https://accounts.google.com/o/oauth2/auth',token_uri:'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url:'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url:'https://www.googleapis.com/robot/v1/metadata/x509/github-action-1445078769%40gta6mapa.iam.gserviceaccount.com',
  universe_domain:'googleapis.com'};
}
if(!credential)throw Error('Firebase credentials not valid JSON, base64 JSON, or expected PEM; no release attempted');
const file=process.env.RUNNER_TEMP+'/gta6mapa-v255-preview-only.json';
writeFileSync(file,JSON.stringify(credential),{mode:0o600});
const hosting={site:'gta6mapa',public:'qa/v255-firebase-test',
 ignore:['firebase.json','**/.*','**/node_modules/**'],
 headers:[
  {source:'**/*.html',headers:[{key:'Cache-Control',value:'no-cache, no-store, must-revalidate'}]},
  {source:'**/*.json',headers:[{key:'Cache-Control',value:'no-cache, max-age=0, must-revalidate'}]},
  {source:'**/sw.js',headers:[{key:'Cache-Control',value:'no-cache, no-store, must-revalidate'}]}
 ]};
writeFileSync('firebase.json',JSON.stringify({hosting},null,2));
writeFileSync('.firebaserc',JSON.stringify({projects:{default:'gta6mapa'}}));
const args=['--yes','firebase-tools@15.22.1','hosting:channel:deploy','prueba-web-v255-qa',
 '--expires','3d','--project','gta6mapa','--non-interactive'];
console.log('Beginning preview-channel ONLY deploy; production live is untouched');
const res=spawnSync('npx',args,{env:{...process.env,GOOGLE_APPLICATION_CREDENTIALS:file},
 stdio:'inherit',timeout:480000});
if(res.status!==0)throw Error('Preview channel deploy failed; no live release');
console.log('V255 preview deployed to a TEST CHANNEL only; review URL in Firebase CLI output');

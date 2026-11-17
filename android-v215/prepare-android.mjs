import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const stage=process.argv[2];
const target=path.join(root,'android-v215');
const source=path.join(root,'app');
const web=path.join(target,'www');
const check=(condition,message)=>{if(!condition)throw Error(message)};
const read=(p)=>fs.readFileSync(p,'utf8');
const must=['index.html','app-v137.js','app-v137.css','news-v155.js','community-v206.js',
  'online-updates.js','online-config.json','vi-i18n.js','mobile-v215.css','mobile-v215.js',
  'mobile-v212.css','mobile-v212.js','mobile-v211.css','mobile-v211.js',
  'mobile-v224-native.js','partida-transfer-v225.js','map-v232-focus.css','atlas-v247-ios-v240-qa.js','atlas-v247-ios-v241-qa.js','atlas-v247-ios-v242-qa.js','atlas-v247-ios-v242-remote-map.js','sw.js'];
if(stage==='stage'){
  for(const name of must)check(fs.statSync(path.join(source,name)).size>0,'App missing '+name);
  const html=read(path.join(source,'index.html'));
  for(const name of must.filter(x=>x.endsWith('.js')&&x!=='sw.js'||x.endsWith('.css'))){
    if(['app-v137.js','app-v137.css','mobile-v215.css','mobile-v215.js','news-v155.js','community-v206.js','online-updates.js'].includes(name))
      check(html.includes(name),'HTML does not load '+name);
  }
  const conf=JSON.parse(read(path.join(source,'online-config.json')));
  check(conf.enabled===true,'Automatic signed news/catalog updates disabled');
  check(conf.manifestUrl==='https://bautistal99.github.io/game-atlas-privacidad/updates/catalog-envelope.json',
    'Signed catalog URL changed');
  check(conf.publicKeyEd25519Base64?.length===44,'Catalog signature public key missing');
  const android=JSON.parse(read(path.join(target,'capacitor.config.json')));
  check(android.appId==='com.indie.viassistant','Changing package identity loses continuity with Google Play');
  fs.rmSync(web,{recursive:true,force:true});
  fs.cpSync(source,web,{recursive:true,force:true});
  check(fs.readFileSync(path.join(web,'index.html')).equals(fs.readFileSync(path.join(source,'index.html'))),
    'Web HTML must be the exact approved V215 file');
  console.log('PASS: identical V247 web client, official/independent news, wiki and Ed25519 signed live feeds');
}else if(stage==='native'){
  const dir=path.join(target,'android');
  check(fs.existsSync(path.join(dir,'app','build.gradle')),'Capacitor native Android missing');
  const gradle=path.join(dir,'app','build.gradle');
  let g=read(gradle);
  check(/versionCode\s+\d+/.test(g)&&/versionName\s+['"][^'"]+['"]/.test(g),'No Android version fields');
  g=g.replace(/versionCode\s+\d+/,'versionCode 249')
    .replace(/versionName\s+['"][^'"]+['"]/,'versionName "1.52.0"');
  // QA debug APK can coexist with the Play Store app: only debug gets a suffix.
  const buildTypes=/buildTypes\s*\{\s*release\s*\{/;
  check(buildTypes.test(g),'Expected buildTypes with release block in Gradle');
  g=g.replace(buildTypes,'buildTypes {\n        debug {\n            applicationIdSuffix ".qa"\n        }\n        release {');
  fs.writeFileSync(gradle,g);
  const vars=path.join(dir,'variables.gradle');
  let v=read(vars);
  check(/targetSdkVersion\s*=\s*\d+/.test(v),'No Android target SDK');
  check(/compileSdkVersion\s*=\s*\d+/.test(v),'No Android compile SDK');
  v=v.replace(/targetSdkVersion\s*=\s*\d+/,'targetSdkVersion = 36')
    .replace(/compileSdkVersion\s*=\s*\d+/,'compileSdkVersion = 36');
  fs.writeFileSync(vars,v);
  const res=path.join(dir,'app','src','main','res');
  // V249: overwrite every legacy AND adaptive launcher PNG. V248 APK still
  // contained the original Capacitor blue-X ic_launcher_foreground.png asset.
  // Android OEM launchers may select that resource even if classic icons change.
  const logo=fs.readFileSync(path.join(web,'icons','icon-512.png'));
  const brand=path.join(target,'branding-v249');
  for(const density of ['mdpi','hdpi','xhdpi','xxhdpi','xxxhdpi']){
    for(const name of ['ic_launcher.png','ic_launcher_round.png','ic_launcher_foreground.png']){
      const original=path.join(brand,'mipmap-'+density,name);
      check(fs.existsSync(original),'Missing V249 branded launcher icon '+original);
      const out=path.join(res,'mipmap-'+density,name);
      fs.mkdirSync(path.dirname(out),{recursive:true});
      fs.copyFileSync(original,out);
    }
  }
  // Adaptive launcher icons on Android 8+: Capacitor's default foreground can
  // override mipmap PNGs, so explicitly bind the VI logo for BOTH icon shapes.
  // Keep the full VI artwork within the adaptive icon's safety area.
  const qaLogo=path.join(res,'drawable-nodpi','ga_launcher_logo.png');
  fs.mkdirSync(path.dirname(qaLogo),{recursive:true});
  fs.writeFileSync(qaLogo,logo);
  const fg=path.join(res,'drawable','ga_launcher_foreground.xml');
  fs.mkdirSync(path.dirname(fg),{recursive:true});
  fs.writeFileSync(fg,'<?xml version="1.0" encoding="utf-8"?>\n<inset xmlns:android="http://schemas.android.com/apk/res/android" android:drawable="@mipmap/ic_launcher_foreground" android:inset="0dp"/>\n');
  const colors=path.join(res,'values','ga_launcher_colors.xml');
  fs.writeFileSync(colors,'<?xml version="1.0" encoding="utf-8"?>\n<resources><color name="ga_launcher_background">#080D25</color></resources>\n');
  const adaptive='<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n<background android:drawable="@color/ga_launcher_background"/>\n<foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n</adaptive-icon>\n';
  const anydpi=path.join(res,'mipmap-anydpi-v26');
  fs.mkdirSync(anydpi,{recursive:true});
  for(const name of ['ic_launcher.xml','ic_launcher_round.xml'])fs.writeFileSync(path.join(anydpi,name),adaptive);
  const strings=path.join(res,'values','strings.xml');
  let text=read(strings);
  check(/<string\s+name="app_name">[^<]*<\/string>/.test(text),'Missing Android brand string');
  text=text.replace(/<string\s+name="app_name">[^<]*<\/string>/,
    '<string name="app_name">Game Atlas Companion</string>');
  fs.writeFileSync(strings,text);
  // Distinct debug launcher name; release preserves the original display name.
  const debugStrings=path.join(dir,'app','src','debug','res','values','strings.xml');
  fs.mkdirSync(path.dirname(debugStrings),{recursive:true});
  fs.writeFileSync(debugStrings,'<resources><string name="app_name">Game Atlas V249 TEST</string></resources>\n');
  const base=path.join(dir,'app','src','main','java');
  const candidates=[];
  const walk=(folder)=>{for(const f of fs.readdirSync(folder,{withFileTypes:true})){
    const file=path.join(folder,f.name);
    if(f.isDirectory())walk(file);
    else if(f.name==='MainActivity.java')candidates.push(file);
  }};
  walk(base);check(candidates.length===1,'MainActivity expected once');
  const file=candidates[0],code=read(file);
  const pkg=code.match(/package\s+[a-zA-Z0-9_.]+\s*;/)?.[0];
  check(pkg,'Missing native Android package');
  const java=[
    'import android.content.res.Configuration;',
    'import android.graphics.Color;',
    'import android.os.Build;',
    'import android.os.Bundle;',
    'import android.view.View;',
    'import android.view.Window;',
    'import android.view.WindowInsets;',
    'import android.view.WindowInsetsController;',
    'import android.view.WindowManager;',
    'import com.getcapacitor.BridgeActivity;',
    '',
    'public class MainActivity extends BridgeActivity {',
    '  private void styleBars(){',
    '    Window window=getWindow();',
    '    boolean dark=(getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK)==Configuration.UI_MODE_NIGHT_YES;',
    '    int status=dark?Color.rgb(16,24,39):Color.rgb(245,246,249);',
    '    window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);',
    '    window.setStatusBarColor(status);',
    '    window.setNavigationBarColor(Color.rgb(17,26,43));',
    '    if(Build.VERSION.SDK_INT>=29)window.setNavigationBarContrastEnforced(false);',
    '    if(Build.VERSION.SDK_INT>=30){',
    '      WindowInsetsController control=window.getInsetsController();',
    '      if(control!=null){',
    '        control.setSystemBarsAppearance(dark?0:WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS,',
    '          WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS);',
    '        control.setSystemBarsAppearance(0,WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS);',
    '      }',
    '    }else{',
    '      int flags=window.getDecorView().getSystemUiVisibility();',
    '      flags=dark?flags & ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR:flags | View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;',
    '      flags &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;',
    '      window.getDecorView().setSystemUiVisibility(flags);',
    '    }',
    '  }',
    '  @Override public void onCreate(Bundle savedInstanceState){',
    '    super.onCreate(savedInstanceState);',
    '    styleBars();',
    '    if(Build.VERSION.SDK_INT>=30)getWindow().setDecorFitsSystemWindows(false);',
    '    final View content=findViewById(android.R.id.content);',
    '    if(content!=null){',
    '      content.setFitsSystemWindows(false);',
    '      content.setOnApplyWindowInsetsListener((view,insets)->{',
    '        int top=0,bottom=0;',
    '        if(Build.VERSION.SDK_INT>=30){',
    '          android.graphics.Insets bars=insets.getInsets(',
    '            WindowInsets.Type.statusBars()|WindowInsets.Type.navigationBars()|WindowInsets.Type.displayCutout());',
    '          top=bars.top;bottom=bars.bottom;',
    '        }else{top=insets.getSystemWindowInsetTop();bottom=insets.getSystemWindowInsetBottom();}',
    '        if(view.getPaddingTop()!=top||view.getPaddingBottom()!=bottom)',
    '          view.setPadding(view.getPaddingLeft(),top,view.getPaddingRight(),bottom);',
    '        return insets;',
    '      });',
    '      content.post(()->content.requestApplyInsets());',
    '    }',
    '  }',
    '  @Override public void onResume(){super.onResume();styleBars();}',
    '  @Override public void onConfigurationChanged(Configuration config){super.onConfigurationChanged(config);styleBars();}',
    '}'
  ];
  fs.writeFileSync(file,pkg+'\n'+java.join('\n')+'\n');
  console.log('PASS: Android Play ID com.indie.viassistant; versionCode 249; SDK 36; safe areas; Game Atlas brand');
}else{
  throw Error('Use: node android-v215/prepare-android.mjs stage|native');
}
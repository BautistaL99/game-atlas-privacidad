import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const stage=process.argv[2];
const target=path.join(root,'android-v220');
const source=path.join(root,'app');
const web=path.join(target,'www');
const check=(condition,message)=>{if(!condition)throw Error(message)};
const read=(p)=>fs.readFileSync(p,'utf8');
const must=['index.html','app-v137.js','app-v137.css','news-v155.js','community-v206.js',
  'online-updates.js','online-config.json','vi-i18n.js','mobile-v215.css','mobile-v215.js',
  'mobile-v212.css','mobile-v212.js','mobile-v211.css','mobile-v211.js','sw.js'];
if(stage==='stage'){
  for(const name of must)check(fs.statSync(path.join(source,name)).size>0,'App missing '+name);
  const html=read(path.join(source,'index.html'));
  check(html.includes('name="vi-web-release" content="V220"'),'Only approved V220 may be packaged');
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
    'Web HTML must be the exact approved V220 file');
  console.log('PASS: identical V220 web client, official/independent news, wiki and Ed25519 signed live feeds');
}else if(stage==='native'){
  const dir=path.join(target,'android');
  check(fs.existsSync(path.join(dir,'app','build.gradle')),'Capacitor native Android missing');
  const gradle=path.join(dir,'app','build.gradle');
  let g=read(gradle);
  check(/versionCode\s+\d+/.test(g)&&/versionName\s+['"][^'"]+['"]/.test(g),'No Android version fields');
  g=g.replace(/versionCode\s+\d+/,'versionCode 220')
    .replace(/versionName\s+['"][^'"]+['"]/,'versionName "1.50.0"');
  fs.writeFileSync(gradle,g);
  const vars=path.join(dir,'variables.gradle');
  let v=read(vars);
  check(/targetSdkVersion\s*=\s*\d+/.test(v),'No Android target SDK');
  check(/compileSdkVersion\s*=\s*\d+/.test(v),'No Android compile SDK');
  v=v.replace(/targetSdkVersion\s*=\s*\d+/,'targetSdkVersion = 36')
    .replace(/compileSdkVersion\s*=\s*\d+/,'compileSdkVersion = 36');
  fs.writeFileSync(vars,v);
  const res=path.join(dir,'app','src','main','res');
  const logo=fs.readFileSync(path.join(web,'icons','icon-512.png'));
  for(const density of ['mdpi','hdpi','xhdpi','xxhdpi','xxxhdpi']){
    for(const name of ['ic_launcher.png','ic_launcher_round.png']){
      const out=path.join(res,'mipmap-'+density,name);
      fs.mkdirSync(path.dirname(out),{recursive:true});
      fs.writeFileSync(out,logo);
    }
  }
  const strings=path.join(res,'values','strings.xml');
  let text=read(strings);
  check(/<string\s+name="app_name">[^<]*<\/string>/.test(text),'Missing Android brand string');
  text=text.replace(/<string\s+name="app_name">[^<]*<\/string>/,
    '<string name="app_name">Game Atlas Companion</string>');
  fs.writeFileSync(strings,text);
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
  console.log('PASS: Android Play ID com.indie.viassistant; versionCode 220; SDK 36; safe areas; Game Atlas brand');
}else{
  throw Error('Use: node android-v220/prepare-android.mjs stage|native');
}

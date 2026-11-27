// App installieren (Taste im Menü): Android über beforeinstallprompt, iPhone/iPad mit Anleitung.
(()=>{
  const apple=/iPhone|iPad|iPod/.test(navigator.userAgent)||
    (navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const android=navigator.userAgentData?.platform==='Android'||/Android/.test(navigator.userAgent);
  if(!apple&&!android)return;

  const button=document.getElementById('installBtn');
  const help=document.getElementById('installHelp');
  const displayMode=matchMedia('(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)');
  let installPrompt=null,installed=false;
  const reflectInstalled=()=>{
    const hide=installed||displayMode.matches||navigator.standalone===true;
    button.classList.toggle('hidden',hide);
    if(hide&&help.open)help.close();
  };
  const markInstalled=()=>{installed=true;installPrompt=null;reflectInstalled();};
  reflectInstalled();
  displayMode.addEventListener('change',reflectInstalled);
  window.addEventListener('appinstalled',markInstalled);
  if(android)window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();
    installPrompt=event;
  });
  document.getElementById(apple?'installApple':'installAndroid').classList.remove('hidden');
  button.addEventListener('click',async()=>{
    if(installPrompt){
      const prompt=installPrompt;
      installPrompt=null;
      button.disabled=true;
      try{
        await prompt.prompt();
        if((await prompt.userChoice).outcome==='accepted')markInstalled();
        return;
      }catch{
        // Wenn der Browser den Dialog nicht öffnen kann, bleiben die manuellen Schritte verfügbar.
      }finally{
        button.disabled=false;
      }
    }
    if(!button.classList.contains('hidden'))help.showModal();
  });
})();

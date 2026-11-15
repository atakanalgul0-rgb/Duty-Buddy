/* Duty Buddy - optional on-device AI (experimental). Safe to delete this file: the app keeps working without it.
   Two engines: WebGPU (fast, needs a GPU the browser can use) and CPU (WebAssembly, slower, works on phones without WebGPU). */
(function(){
  var LIB='https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.79/+esm';
  var BIG='Llama-3.2-1B-Instruct-q4f32_1-MLC', SMALL='SmolLM2-360M-Instruct-q4f32_1-MLC';
  var WL='https://cdn.jsdelivr.net/npm/@wllama/wllama@2.3.7/esm/';
  var CPUBIG=['Qwen/Qwen2.5-1.5B-Instruct-GGUF','qwen2.5-1.5b-instruct-q4_k_m.gguf'], CPUSMALL=['Qwen/Qwen2.5-0.5B-Instruct-GGUF','qwen2.5-0.5b-instruct-q4_k_m.gguf'];
  function mget(){try{return localStorage.getItem('dutybuddy.localmodel');}catch(e){return null;}}
  function isSmall(){return mget()==='small';}
  function busy(v){try{if(v)localStorage.setItem('dutybuddy.localbusy','1'); else localStorage.removeItem('dutybuddy.localbusy');}catch(e){}}
  var eng=null, mode='', loading=null;
  function supported(){return !!(window.__WEBLLM_STUB__||window.__WLLAMA_STUB__||(navigator.gpu&&typeof navigator.gpu.requestAdapter==='function')||typeof WebAssembly==='object');}
  async function gpuOk(){if(window.__WEBLLM_STUB__)return true; if(window.__WLLAMA_STUB__)return false; try{if(!navigator.gpu||typeof navigator.gpu.requestAdapter!=='function')return false; return !!(await navigator.gpu.requestAdapter());}catch(e){return false;}}
  function cpuMode(){try{return localStorage.getItem('dutybuddy.localmode')==='cpu';}catch(e){return false;}}
  function label(){return cpuMode()?(isSmall()?'small (0.5B, CPU)':'standard (1.5B, CPU)'):(isSmall()?'small (360M)':'standard (1B)');}
  async function loadGpu(progress){
    var lib=window.__WEBLLM_STUB__||await import(LIB);
    busy(true); var e=await lib.CreateMLCEngine(isSmall()?SMALL:BIG,{initProgressCallback:function(r){try{progress&&progress(r&&r.text||'',r&&typeof r.progress==='number'?r.progress:null);}catch(x){}}});
    busy(false); return e;
  }
  async function loadCpu(progress){
    try{if(mget()===null||mget()==='')localStorage.setItem('dutybuddy.localmodel','small');}catch(e){}
    var m=isSmall()?CPUSMALL:CPUBIG, w;
    if(window.__WLLAMA_STUB__)w=window.__WLLAMA_STUB__;
    else{
      var lib=await import(WL+'index.js');
      w=new lib.Wllama({'single-thread/wllama.wasm':WL+'single-thread/wllama.wasm','multi-thread/wllama.wasm':WL+'multi-thread/wllama.wasm'});
      busy(true);
      await w.loadModelFromHF(m[0],m[1],{n_ctx:4096,progressCallback:function(p){try{if(progress&&p&&p.total)progress('Downloading model '+Math.round(p.loaded/1048576)+' of '+Math.round(p.total/1048576)+' MB',p.loaded/p.total);}catch(x){}}});
      busy(false);
    }
    return {cpu:true,w:w};
  }
  async function load(progress){
    if(eng)return eng; if(loading)return loading;
    loading=(async function(){
      try{
        var useGpu=await gpuOk(), e=null;
        if(useGpu){try{e=await loadGpu(progress); mode='gpu'; try{localStorage.setItem('dutybuddy.localmode','gpu');}catch(x){}}catch(er){busy(false); if(!/gpu|adapter/i.test(String(er&&er.message||er)))throw er; e=null;}}
        if(!e){progress&&progress('This phone has no usable GPU, so I use the slower CPU engine.',null); e=await loadCpu(progress); mode='cpu'; try{localStorage.setItem('dutybuddy.localmode','cpu');}catch(x){}}
        eng=e; return eng;
      }catch(e){busy(false); throw e;}finally{loading=null;}
    })();
    return loading;
  }
  async function ask(input,opts){
    var e=await load(); var msgs=typeof input==='string'?[{role:'user',content:input.length>8000?input.slice(0,2500)+'\n...\n'+input.slice(-5500):input}]:input; var mx=(opts&&opts.max)||600;
    busy(true); var r; try{
      if(e&&e.cpu){var t=await e.w.createChatCompletion(msgs,{nPredict:mx,sampling:{temp:0.2}}); busy(false); return String(t||'');}
      r=await e.chat.completions.create({messages:msgs,temperature:0.2,max_tokens:mx});
    }catch(er){busy(false); throw er;}
    busy(false); return String(r&&r.choices&&r.choices[0]&&r.choices[0].message&&r.choices[0].message.content||'');
  }
  async function remove(){
    try{if(eng&&eng.cpu&&eng.w&&eng.w.exit)await eng.w.exit();}catch(e){}
    eng=null; try{localStorage.removeItem('dutybuddy.localmode');}catch(e){}
    try{var ks=await caches.keys(); await Promise.all(ks.filter(function(k){return /^webllm|wllama/i.test(k)||k==='dutybuddy-ext';}).map(function(k){return caches.delete(k);}));}catch(e){}
    try{var dbs=indexedDB.databases?await indexedDB.databases():[]; dbs.forEach(function(d){if(d.name&&/webllm|tvm|wllama/i.test(d.name))indexedDB.deleteDatabase(d.name);});}catch(e){}
    try{if(navigator.storage&&navigator.storage.getDirectory){var root=await navigator.storage.getDirectory(), names=[]; for await(var en of root.keys())names.push(en); for(var i=0;i<names.length;i++){if(/wllama|cache|llama|gguf/i.test(names[i])){try{await root.removeEntry(names[i],{recursive:true});}catch(x){}}}}}catch(e){}
  }
  window.DBLocalAI={supported:supported,load:load,ask:ask,remove:remove,small:isSmall,label:label};
})();

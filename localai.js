/* Duty Buddy - optional on-device AI (experimental). Safe to delete this file: the app keeps working without it. */
(function(){
  var LIB='https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.79/+esm';
  var BIG='Llama-3.2-1B-Instruct-q4f32_1-MLC', SMALL='SmolLM2-360M-Instruct-q4f32_1-MLC';
  function isSmall(){try{return localStorage.getItem('dutybuddy.localmodel')==='small';}catch(e){return false;}}
  function busy(v){try{if(v)localStorage.setItem('dutybuddy.localbusy','1'); else localStorage.removeItem('dutybuddy.localbusy');}catch(e){}}
  var eng=null, loading=null;
  function supported(){return !!(window.__WEBLLM_STUB__||(navigator.gpu&&typeof navigator.gpu.requestAdapter==='function'));}
  async function load(progress){
    if(eng)return eng; if(loading)return loading;
    loading=(async function(){
      try{
        var lib=window.__WEBLLM_STUB__||await import(LIB);
        busy(true); eng=await lib.CreateMLCEngine(isSmall()?SMALL:BIG,{initProgressCallback:function(r){try{progress&&progress(r&&r.text||'',r&&typeof r.progress==='number'?r.progress:null);}catch(e){}}});
        busy(false); return eng;
      }catch(e){busy(false); throw e;}finally{loading=null;}
    })();
    return loading;
  }
  async function ask(input,opts){
    var e=await load(); var msgs=typeof input==='string'?[{role:'user',content:input.length>8000?input.slice(0,2500)+'\n...\n'+input.slice(-5500):input}]:input;
    busy(true); var r; try{r=await e.chat.completions.create({messages:msgs,temperature:0.2,max_tokens:(opts&&opts.max)||600});}catch(er){busy(false); throw er;}
    busy(false); return String(r&&r.choices&&r.choices[0]&&r.choices[0].message&&r.choices[0].message.content||'');
  }
  async function remove(){
    eng=null; try{var ks=await caches.keys(); await Promise.all(ks.filter(function(k){return /^webllm/i.test(k)||k==='dutybuddy-ext';}).map(function(k){return caches.delete(k);}));}catch(e){}
    try{var dbs=indexedDB.databases?await indexedDB.databases():[]; dbs.forEach(function(d){if(d.name&&/webllm|tvm/i.test(d.name))indexedDB.deleteDatabase(d.name);});}catch(e){}
  }
  window.DBLocalAI={supported:supported,load:load,ask:ask,remove:remove,small:isSmall};
})();

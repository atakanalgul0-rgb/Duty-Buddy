/* Duty Buddy - optional on-device AI (experimental). Safe to delete this file: the app keeps working without it. */
(function(){
  var LIB='https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.79/+esm';
  var MODEL='Llama-3.2-1B-Instruct-q4f32_1-MLC';
  var eng=null, loading=null;
  function supported(){return !!(window.__WEBLLM_STUB__||(navigator.gpu&&typeof navigator.gpu.requestAdapter==='function'));}
  async function load(progress){
    if(eng)return eng; if(loading)return loading;
    loading=(async function(){
      try{
        var lib=window.__WEBLLM_STUB__||await import(LIB);
        eng=await lib.CreateMLCEngine(MODEL,{initProgressCallback:function(r){try{progress&&progress(r&&r.text||'',r&&typeof r.progress==='number'?r.progress:null);}catch(e){}}});
        return eng;
      }finally{loading=null;}
    })();
    return loading;
  }
  async function ask(input,opts){
    var e=await load(); var msgs=typeof input==='string'?[{role:'user',content:input.length>9000?input.slice(0,9000):input}]:input;
    var r=await e.chat.completions.create({messages:msgs,temperature:0.2,max_tokens:(opts&&opts.max)||600});
    return String(r&&r.choices&&r.choices[0]&&r.choices[0].message&&r.choices[0].message.content||'');
  }
  async function remove(){
    eng=null; try{var ks=await caches.keys(); await Promise.all(ks.filter(function(k){return /^webllm/i.test(k)||k==='dutybuddy-ext';}).map(function(k){return caches.delete(k);}));}catch(e){}
    try{var dbs=indexedDB.databases?await indexedDB.databases():[]; dbs.forEach(function(d){if(d.name&&/webllm|tvm/i.test(d.name))indexedDB.deleteDatabase(d.name);});}catch(e){}
  }
  window.DBLocalAI={supported:supported,load:load,ask:ask,remove:remove,model:MODEL};
})();

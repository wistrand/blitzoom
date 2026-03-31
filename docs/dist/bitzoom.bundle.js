function Me(e){let t="",o=-1;for(let n in e)e[n]>o&&(o=e[n],t=n);return t}var ee=128,pe=2147483647,Te=16,oe=1<<Te,se=[1,2,3,4,5,6,7,8,9,10,11,12,13,14],ie=14,st=["L1","L2","L3","L4","L5","L6","L7","L8","L9","L10","L11","L12","L13","L14","RAW"],rt=.1,it=.1;function kt(e){return function(){e|=0,e=e+1831565813|0;let t=Math.imul(e^e>>>15,1|e);return t=t+Math.imul(t^t>>>7,61|t)^t,((t^t>>>14)>>>0)/4294967296}}var Tt=kt(42),Ve=new Int32Array(ee),je=new Int32Array(ee);for(let e=0;e<ee;e++)Ve[e]=Math.floor(Tt()*(pe-1))+1,je[e]=Math.floor(Tt()*(pe-1));function nt(e){let t=0;for(let o=0;o<e.length;o++)t=Math.imul(31,t)+e.charCodeAt(o)|0;return t>>>0}var ne=new Int32Array(ee);function Ft(e){return e=(e&pe)+(e/2147483648|0),e>=pe?e-pe:e}function It(e,t,o){let n=t>>>16,s=t&65535,r=Ft(e*n);return Ft(r*65536+e*s+o)}var Ce=new Uint8Array(ee);function ge(e,t){if(t===0){for(let o=0;o<ee;o++)ne[o]=-1;return}if(t<12){for(let o=0;o<ee;o++)ne[o]=pe;for(let o=0;o<t;o++){let n=nt(e[o]);for(let s=0;s<ee;s++){let r=It(Ve[s],n,je[s]);r<ne[s]&&(ne[s]=r)}}return}for(let o=0;o<ee;o++)ne[o]=pe,Ce[o]=0;for(let o=0;o<t;o++){let n=nt(e[o]),s=It(Ve[0],n,je[0]),r=s%ee,i=s/ee|0;i<ne[r]&&(ne[r]=i,Ce[r]=1)}for(let o=0;o<ee;o++){if(Ce[o])continue;let n=(o*2654435761>>>0)%ee,s=0;for(;!Ce[n]&&s<ee;)n=(n*2654435761+1>>>0)%ee,s++;Ce[n]&&(ne[o]=ne[n])}}function Fe(e,t){let o=kt(e),n=[new Float64Array(t),new Float64Array(t)];for(let s=0;s<2;s++)for(let r=0;r<t;r+=2){let i=Math.max(1e-10,o()),a=o(),u=Math.sqrt(-2*Math.log(i));n[s][r]=u*Math.cos(2*Math.PI*a),r+1<t&&(n[s][r+1]=u*Math.sin(2*Math.PI*a))}return n}function me(e,t,o,n){if(e[0]===-1){o[n]=0,o[n+1]=0;return}let s=0;for(let p=0;p<ee;p++)s+=e[p];s/=ee;let r=0;for(let p=0;p<ee;p++){let h=e[p]-s;r+=h*h}let i=Math.sqrt(r/ee)||1,a=t[0],u=t[1],c=0,d=0;for(let p=0;p<ee;p++){let h=(e[p]-s)/i;c+=h*a[p],d+=h*u[p]}o[n]=c,o[n+1]=d}function $e(e,t,o){let n=Te-o,s=e>>n,r=t>>n;return s<<o|r}function Ie(e){let t=e.length,o=e.map((s,r)=>({i:r,v:s.px,id:s.id})).sort((s,r)=>s.v-r.v||(s.id<r.id?-1:s.id>r.id?1:0));for(let s=0;s<t;s++)e[o[s].i].gx=Math.min(oe-1,Math.floor(s/t*oe)),e[o[s].i].px=s/t*2-1;let n=e.map((s,r)=>({i:r,v:s.py,id:s.id})).sort((s,r)=>s.v-r.v||(s.id<r.id?-1:s.id>r.id?1:0));for(let s=0;s<t;s++)e[n[s].i].gy=Math.min(oe-1,Math.floor(s/t*oe)),e[n[s].i].py=s/t*2-1}var Ae=8192,ve=new Float64Array(Ae+1);{let e=t=>{let i=Math.abs(t),a=1/(1+.278393*i+.230389*i*i+972e-6*i*i*i+.078108*i*i*i*i),u=1-a*a*a*a;return t>=0?u:-u};for(let t=0;t<=Ae;t++){let o=t/Ae*8-4;ve[t]=.5*(1+e(o*Math.SQRT1_2))}}function Ht(e){let t=(e+4)*(Ae/8),o=t|0;if(o>=Ae)return ve[Ae];if(o<0)return ve[0];let n=t-o;return ve[o]+n*(ve[o+1]-ve[o])}function He(e,t){let o=e.length;if(o===0)return;let n,s,r,i;if(t&&t._initialized)n=t.mx,s=t.my,r=t.sx,i=t.sy;else{let a=0,u=0;for(let p=0;p<o;p++)a+=e[p].px,u+=e[p].py;n=a/o,s=u/o;let c=0,d=0;for(let p=0;p<o;p++){let h=e[p].px-n,l=e[p].py-s;c+=h*h,d+=l*l}r=Math.sqrt(c/o)||1,i=Math.sqrt(d/o)||1,t&&(t.mx=n,t.my=s,t.sx=r,t.sy=i,t._initialized=!0)}for(let a=0;a<o;a++){let u=Ht((e[a].px-n)/r),c=Ht((e[a].py-s)/i);e[a].gx=Math.min(oe-1,Math.floor(u*oe)),e[a].gy=Math.min(oe-1,Math.floor(c*oe)),e[a].px=u*2-1,e[a].py=c*2-1}}function ke(e,t,o,n,s,r,i,a,u){let c=o,d=0;for(let S of t){let v=c[S]||0;v>d&&(d=v)}let p=Math.max(d*rt,it),h=0,l={};for(let S of t)l[S]=Math.max(c[S]||0,p),h+=l[S];let m=e.length,g=new Float64Array(m),f=new Float64Array(m);for(let S=0;S<m;S++){let v=e[S],x=0,y=0;for(let A of t){let w=v.projections[A];w&&(x+=w[0]*l[A],y+=w[1]*l[A])}g[S]=x/h,f[S]=y/h,v.px=g[S],v.py=f[S]}let _=()=>a==="gaussian"?He(e,u):Ie(e);if(n===0||i===0){_();return}let M=Math.max(0,Math.min(1,n));for(let S=0;S<i;S++){let v=new Float64Array(m),x=new Float64Array(m);for(let y=0;y<m;y++){let A=e[y],w=s[A.id];if(w&&w.length>0){let E=0,b=0,R=0;for(let F of w){let H=r[F];H&&(E+=H.px,b+=H.py,R++)}R>0?(E/=R,b/=R,v[y]=(1-M)*g[y]+M*E,x[y]=(1-M)*f[y]+M*b):(v[y]=g[y],x[y]=f[y])}else v[y]=g[y],x[y]=f[y]}for(let y=0;y<m;y++)e[y].px=v[y],e[y].py=x[y]}_()}function Ot(e,t,o,n,s){let r=new Map;for(let a=0;a<t.length;a++){let u=t[a],c=$e(u.gx,u.gy,e),d=r.get(c);d||(d=[],r.set(c,d)),d.push(u)}let i=[];for(let[a,u]of r){let c=a>>e,d=a&(1<<e)-1,p={},h={},l={},m=0,g=0,f=0,_=-1,M=u[0];for(let F=0;F<u.length;F++){let H=u[F];if(g+=H.px,f+=H.py,p[H.group]=(p[H.group]||0)+1,o){let L=o(H);h[L]=(h[L]||0)+1}if(n){let L=n(H);l[L]=(l[L]||0)+1}m+=H.degree,H.degree>_&&(_=H.degree,M=H)}let S=g/u.length,v=f/u.length,x=Me(p),y=m/u.length,A=m,w=M.label||M.id,E=o?Me(h):x,b=s&&s(E)||"#888888",R=n?Me(l):w;i.push({bid:a,members:u,ax:S,ay:v,domGroup:x,avgDegree:y,totalDegree:A,repName:w,cachedColorVal:E,cachedColor:b,cachedLabel:R,x:0,y:0,cx:c,cy:d})}return{supernodes:i,snEdges:[],level:e,_edgesReady:!1}}function ue(e,t,o){if(t==="label")return e.label||e.id;if(t==="group")return e.group||"unknown";if(t==="structure")return`deg:${e.degree}`;if(t==="neighbors")return`${(o[e.id]||[]).length} nbrs`;if(t==="edgetype"&&e.edgeTypes){let n=Array.isArray(e.edgeTypes)?e.edgeTypes:[...e.edgeTypes];return n.length>0?n[0]:e.id}if(e.extraProps&&Object.prototype.hasOwnProperty.call(e.extraProps,t)){let n=e.extraProps[t];return n!=null?String(n):e.label||e.id}return e.label||e.id}function at(e,t,o){if(t==="label")return e.repName;let n={};for(let s of e.members){let r=ue(s,t,o);n[r]=(n[r]||0)+1}return Me(n)}function _o(e,t,o){t/=100,o/=100;let n=t*Math.min(o,1-o),s=r=>{let i=(r+e/30)%12,a=o-n*Math.max(Math.min(i-3,9-i,1),-1);return Math.round(255*a).toString(16).padStart(2,"0")};return`#${s(0)}${s(8)}${s(4)}`}function yo(e,t,o){return"#"+((1<<24)+(e<<16)+(t<<8)+o).toString(16).slice(1)}function xo(e,t){t=Math.max(0,Math.min(1,t));let o=t*(e.length-1),n=Math.floor(o),s=Math.min(n+1,e.length-1),r=o-n;return yo(Math.round(e[n][0]+(e[s][0]-e[n][0])*r),Math.round(e[n][1]+(e[s][1]-e[n][1])*r),Math.round(e[n][2]+(e[s][2]-e[n][2])*r))}function he(e){return t=>{let o={},n=t.length;for(let s=0;s<n;s++)o[t[s]]=xo(e,n===1?.5:s/(n-1));return o}}var vo=[[72,35,116],[64,67,135],[52,94,141],[41,120,142],[32,144,140],[34,167,132],[68,190,112],[121,209,81],[189,222,38],[253,231,37]],Mo=[[126,3,167],[168,34,150],[203,70,121],[229,107,93],[248,148,65],[253,195,40],[239,248,33]],Ao=[[106,23,110],[147,38,103],[188,55,84],[221,81,58],[243,118,27],[252,165,10],[246,215,70],[252,255,164]],wo=[[80,50,155],[120,40,160],[165,30,140],[200,35,100],[225,60,60],[240,100,30],[250,155,15],[255,220,50]],So=[[45,100,55],[60,135,65],[80,165,80],[100,190,100],[130,210,130],[170,228,160],[210,243,200]],Lo=[[140,30,30],[175,40,35],[210,55,40],[230,80,50],[240,120,75],[248,165,110],[252,210,165]],Eo=[[69,117,180],[116,173,209],[171,217,233],[224,243,248],[255,255,191],[254,224,144],[253,174,97],[244,109,67],[215,48,39]],bo=[[90,90,100],[120,120,130],[150,150,160],[180,180,190],[210,210,218],[235,235,242]],ct=0,Bo=1,Po=2,Ro=3,Co=4,To=5,Fo=6,Io=7,Ho=8,lt=["vivid","viridis","plasma","inferno","thermal","grayscale","diverging","greens","reds"],Oe=[e=>{let t={};for(let n=0;n<e.length;n++)t[e[n]]=_o(n*137.508%360,65,62);return t},he(vo),he(Mo),he(Ao),he(wo),he(bo),he(Eo),he(So),he(Lo)];function Ge(e,t=0){return Oe[t%Oe.length](e)}function ko(e,t){let o=16-t,n=1<<t,s=n*n,r=new Map;for(let l=0;l<e.length;l++){let m=(e[l].gx>>o)*n+(e[l].gy>>o);r.set(m,(r.get(m)||0)+1)}let i=r.size;if(i<=1)return 0;let a=i/s,u=0,c=0;for(let l of r.values())u+=l,c+=l*l;let d=u/i,p=c/i-d*d,h=Math.sqrt(Math.max(0,p))/Math.max(1,d);return a*h}function Oo(e,t){t==="gaussian"?He(e,{}):Ie(e)}var Gt=()=>new Promise(e=>requestAnimationFrame(e));async function ut(e,t,o,n,s={}){let r=performance.now(),i=s.weights!==!1,a=s.alpha!==!1,u=s.quant!==!1,c=s.onProgress,d=s.signal,p=s.timeout??2e4,h=[0,3,8,10],l=[0,.25,.5,.75,1],m=u?["rank","gaussian"]:["gaussian"],g=a?l:[0],f=Math.max(3,Math.min(7,Math.round(Math.log2(e.length)-2))),_=new Set(["label","structure","neighbors"]),M=t.filter(k=>{if(_.has(k))return!1;if(k==="edgetype"){let O=new Set;for(let U of e){if(U.edgeTypes)for(let q of U.edgeTypes)O.add(q);if(O.size>2)return!0}return!1}return!0}),S=!1;if(i)for(let k of M){let O=new Set;for(let U of e){let q=k==="group"?U.group:U.extraProps&&U.extraProps[k]||void 0;if(O.add(q),O.size>1){S=!0;break}}if(S)break}let v=i&&S,x=-1,y={},A=0,w="gaussian",E=0,b=0,R=0,F=M.length,H=(v?F+2:1)*g.length,L=(v?F*h.length:0)+(a?l.length:0),B=H+L*3,I=performance.now(),C=!1,j=()=>d?.aborted||p>0&&performance.now()-r>p,D=async k=>{if(j()){C=!0;return}performance.now()-I>50&&(c&&c({phase:k,step:R,total:B,score:x}),await Gt(),I=performance.now(),j()&&(C=!0))},Z=async k=>{if(j()){C=!0;return}c&&c({phase:k,step:R,total:B,score:x}),await Gt(),I=performance.now(),j()&&(C=!0)},N=new Float64Array(e.length),G=new Float64Array(e.length),W=s.blendFn||ke,T=(k,O)=>{W(e,t,k,O,o,n,5,"gaussian",{}),E++;for(let Y=0;Y<e.length;Y++)N[Y]=e[Y].px,G[Y]=e[Y].py;let U=-1,q="gaussian";for(let Y of m){for(let z=0;z<e.length;z++)e[z].px=N[z],e[z].py=G[z];Oo(e,Y),b++;let J=ko(e,f);J>U&&(U=J,q=Y)}return R++,{score:U,quant:q}},V=[],X={};for(let k of t)X[k]=M.includes(k)?3:0;if(V.push(X),v)for(let k of M){let O={};for(let U of t)O[U]=U===k?8:0;V.push(O)}await Z("presets");let K=[];for(let k=0;k<V.length&&!C;k++){let O=V[k];for(let U of g){let{score:q,quant:Y}=T(O,U);if(q>x&&(x=q,y={...O},A=U,w=Y),k>0&&U===0&&K.push({group:M[k-1],score:q}),await D("presets"),C)break}}if(v&&K.length>=2&&!C){K.sort((q,Y)=>Y.score-q.score);let k=K[0].group,O=K[1].group,U={};for(let q of t)U[q]=q===k||q===O?5:0;for(let q of g){if(C)break;let{score:Y,quant:J}=T(U,q);Y>x&&(x=Y,y={...U},A=q,w=J),await D("presets")}}for(let k=0;k<3&&!C;k++){let O=!1;if(await Z("descent"),C)break;if(v)for(let U of M){if(C)break;let q=y[U];for(let Y of h){y[U]=Y;let{score:J,quant:z}=T(y,A);if(J>x&&(x=J,q=Y,w=z,O=!0),await D("descent"),C)break}y[U]=q}if(a&&!C)for(let U of l){let{score:q,quant:Y}=T(y,U);if(q>x&&(x=q,A=U,w=Y,O=!0),await D("descent"),C)break}if(!O)break}ke(e,t,y,A,o,n,5,w,{}),c&&c({phase:"done",step:B,total:B,score:x});let P=[],$=0,Q=null;for(let k of M)(y[k]||0)>$&&($=y[k]||0,Q=k);if(Q&&Q!=="label"&&P.push(Q),t.includes("label")){let k=new Set;for(let O of e)if(k.add(O.label||O.id),k.size>e.length*.8)break;k.size>1&&k.size<=e.length*.8&&P.push("label")}return{weights:y,alpha:A,quantMode:w,labelProps:P,score:x,blends:E,quants:b,timeMs:Math.round(performance.now()-r)}}function Go(){try{let e=document.createElement("canvas");e.addEventListener("webglcontextlost",o=>o.preventDefault());let t=e.getContext("webgl2");return t?(t.getExtension("WEBGL_lose_context")?.loseContext(),!0):!1}catch{return!1}}function Ut(e){let t=e.getContext("webgl2",{alpha:!1,antialias:!1});if(!t)return console.log("[GL] WebGL2 context creation failed"),null;if(console.log("[GL] WebGL2 context created"),t.getExtension("EXT_color_buffer_half_float"),t.getExtension("EXT_color_buffer_float"),t.getExtension("EXT_float_blend"),t._hasFloatLinear=!!t.getExtension("OES_texture_float_linear"),t.getExtension("EXT_color_buffer_float"),t._circleProgram=Jo(t),!t._circleProgram)return console.log("[GL] Circle shader compilation failed"),null;let o=new Float32Array([-1,-1,1,-1,-1,1,1,1]);t._quadVBO=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,t._quadVBO),t.bufferData(t.ARRAY_BUFFER,o,t.STATIC_DRAW);let n=new Float32Array([0,-1,1,-1,0,1,1,1]);t._edgeLineQuadVBO=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,t._edgeLineQuadVBO),t.bufferData(t.ARRAY_BUFFER,n,t.STATIC_DRAW);let s=16;t._curveSegCount=s;let r=new Float32Array((s+1)*4);for(let i=0;i<=s;i++){let a=i/s;r[i*4]=a,r[i*4+1]=-1,r[i*4+2]=a,r[i*4+3]=1}return t._edgeCurveVBO=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,t._edgeCurveVBO),t.bufferData(t.ARRAY_BUFFER,r,t.STATIC_DRAW),t._instanceVBO=t.createBuffer(),t._edgeLineProgram=Wt(t,Ko),t._edgeCurveProgram=Wt(t,Xo),!t._edgeLineProgram||!t._edgeCurveProgram?(console.log("[GL] Edge shader compilation failed"),null):(t._gridProgram=zo(t),t._gridProgram?(t._heatSplatProg=en(t),t._heatResolveProg=tn(t),!t._heatSplatProg||!t._heatResolveProg?(console.log("[GL] Heatmap shader compilation failed"),null):(t._fsQuadVBO=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,t._fsQuadVBO),t.bufferData(t.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),t.STATIC_DRAW),t._heatFBO=null,t._heatTex=null,t._heatW=0,t._heatH=0,t._heatMaxW=0,t._heatMaxWTarget=0,t._heatMaxWKey="",t._heatFBOBroken=!1,t._heatMaxWTime=0,t._circleVAO=sn(t),t._edgeLineVAO=Dt(t,t._edgeLineQuadVBO),t._edgeCurveVAO=Dt(t,t._edgeCurveVBO),t._heatResolveVAO=on(t),t)):(console.log("[GL] Grid shader compilation failed"),null))}var Wo=`#version 300 es
precision highp float;

// Per-vertex: unit quad corner [-1,1]
layout(location = 0) in vec2 a_quad;

// Per-instance: x, y, radius, r, g, b, a, strokeR, strokeG, strokeB, strokeA
layout(location = 1) in vec2 a_center;
layout(location = 2) in float a_radius;
layout(location = 3) in vec4 a_fillColor;
layout(location = 4) in vec4 a_strokeColor;

uniform vec2 u_resolution;

out vec2 v_uv;
out vec4 v_fillColor;
out vec4 v_strokeColor;
out float v_radius;

void main() {
  v_uv = a_quad;
  v_fillColor = a_fillColor;
  v_strokeColor = a_strokeColor;
  v_radius = a_radius;

  // Expand quad: add 1px margin for AA
  vec2 pos = a_center + a_quad * (a_radius + 1.0);

  // Screen pixels to clip space
  gl_Position = vec4(pos / u_resolution * 2.0 - 1.0, 0.0, 1.0);
  gl_Position.y = -gl_Position.y;
}
`,Do=`#version 300 es
precision highp float;

in vec2 v_uv;
in vec4 v_fillColor;
in vec4 v_strokeColor;
in float v_radius;

out vec4 fragColor;

void main() {
  float dist = length(v_uv) * (v_radius + 1.0);
  float aa = smoothstep(v_radius + 1.0, v_radius - 0.5, dist);
  if (aa < 0.001) discard;

  // Stroke ring: 1px inside the edge
  float strokeMask = smoothstep(v_radius - 2.0, v_radius - 0.5, dist);
  vec4 col = mix(v_fillColor, v_strokeColor, strokeMask * v_strokeColor.a);
  col.a *= aa;
  fragColor = col;
}
`,Uo=`#version 300 es
precision highp float;

layout(location = 0) in vec2 a_quad;
layout(location = 1) in vec2 a_center;
layout(location = 2) in float a_radius;
layout(location = 3) in vec4 a_fillColor;
layout(location = 4) in vec4 a_strokeColor;

uniform vec2 u_resolution;

out vec2 v_uv;
out vec4 v_color;
out float v_radius;

void main() {
  v_uv = a_quad;
  v_color = a_fillColor;
  v_radius = a_radius;

  vec2 pos = a_center + a_quad * (a_radius + 1.0);
  gl_Position = vec4(pos / u_resolution * 2.0 - 1.0, 0.0, 1.0);
  gl_Position.y = -gl_Position.y;
}
`,No=`#version 300 es
precision highp float;

in vec2 v_uv;
in vec4 v_color;
in float v_radius;

out vec4 fragColor;

void main() {
  float dist = length(v_uv);
  float glow = smoothstep(1.0, 0.0, dist);
  glow *= glow;
  fragColor = vec4(v_color.rgb, v_color.a * glow);
}
`,Vo=`#version 300 es
precision highp float;

layout(location = 0) in vec2 a_quad;
layout(location = 1) in vec2 a_center;
layout(location = 2) in float a_radius;
layout(location = 3) in vec4 a_fillColor;
layout(location = 4) in vec4 a_strokeColor;

uniform vec2 u_resolution;

out vec2 v_uv;
out vec3 v_color;
out float v_weight;

void main() {
  v_uv = a_quad;
  v_color = a_fillColor.rgb;
  v_weight = a_fillColor.a;

  vec2 pos = a_center + a_quad * (a_radius + 1.0);
  gl_Position = vec4(pos / u_resolution * 2.0 - 1.0, 0.0, 1.0);
  gl_Position.y = -gl_Position.y;
}
`,jo=`#version 300 es
precision highp float;

in vec2 v_uv;
in vec3 v_color;
in float v_weight;

out vec4 fragColor;

void main() {
  float dist = length(v_uv);
  float t = 1.0 - dist * dist;
  if (t <= 0.0) discard;
  float k = t * t * v_weight;
  fragColor = vec4(v_color * k, k);
}
`,$o=`#version 300 es
precision highp float;
layout(location = 0) in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`,qo=`#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_density;
uniform float u_maxW;
uniform float u_lightMode;

out vec4 fragColor;

void main() {
  vec4 d = texture(u_density, v_uv);
  float w = d.a;
  if (w < 0.001) discard;
  float intensity = min(1.0, w / (u_maxW * 0.3));
  vec3 avgCol = d.rgb / w;
  // Dark: color scaled by intensity. Light: lerp from white toward color.
  vec3 col = mix(avgCol * intensity, 1.0 - (1.0 - avgCol) * intensity, u_lightMode);
  float alpha = mix(intensity * 0.7, intensity * 0.86, u_lightMode);
  fragColor = vec4(col, alpha);
}
`,Yo=`#version 300 es
precision highp float;
layout(location = 0) in vec2 a_pos;
out vec2 v_screenPos;
uniform vec2 u_resolution;
void main() {
  v_screenPos = (a_pos * 0.5 + 0.5) * u_resolution;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`,Zo=`#version 300 es
precision highp float;

in vec2 v_screenPos;
uniform float u_gridSize;
uniform vec2 u_pan;
uniform float u_lightMode;

out vec4 fragColor;

void main() {
  vec2 p = v_screenPos - u_pan;
  vec2 g = abs(fract(p / u_gridSize + 0.5) - 0.5) * u_gridSize;
  float d = min(g.x, g.y);
  float line = 1.0 - smoothstep(0.0, 1.0, d);
  if (line < 0.01) discard;
  // Dark: subtle blue-gray. Light: faint gray.
  vec3 col = mix(vec3(60.0/255.0, 60.0/255.0, 100.0/255.0), vec3(0.4, 0.4, 0.55), u_lightMode);
  float alpha = mix(0.3, 0.15, u_lightMode);
  fragColor = vec4(col, alpha * line);
}
`,Ko=`#version 300 es
precision highp float;

layout(location = 0) in vec2 a_quad;
layout(location = 1) in vec2 a_start;
layout(location = 2) in vec2 a_end;
layout(location = 3) in vec4 a_color;

uniform vec2 u_resolution;
uniform float u_width;

out vec4 v_color;

void main() {
  v_color = a_color;
  vec2 dir = a_end - a_start;
  float len = length(dir);
  if (len < 0.001) { gl_Position = vec4(2.0, 2.0, 0.0, 1.0); return; }
  vec2 fwd = dir / len;
  vec2 perp = vec2(-fwd.y, fwd.x);
  vec2 pos = mix(a_start, a_end, a_quad.x) + perp * a_quad.y * u_width * 0.5;
  gl_Position = vec4(pos / u_resolution * 2.0 - 1.0, 0.0, 1.0);
  gl_Position.y = -gl_Position.y;
}
`,Xo=`#version 300 es
precision highp float;

layout(location = 0) in vec2 a_quad;
layout(location = 1) in vec2 a_start;
layout(location = 2) in vec2 a_end;
layout(location = 3) in vec4 a_color;

uniform vec2 u_resolution;
uniform float u_width;

out vec4 v_color;

void main() {
  v_color = a_color;
  vec2 dir = a_end - a_start;
  float len = length(dir);
  if (len < 0.001) { gl_Position = vec4(2.0, 2.0, 0.0, 1.0); return; }
  vec2 fwd = dir / len;
  vec2 perp = vec2(-fwd.y, fwd.x);

  // Same Bezier control points as Canvas 2D
  vec2 c1 = a_start + dir * 0.3 + perp * len * 0.15;
  vec2 c2 = a_start + dir * 0.7 + perp * len * 0.05;

  // Evaluate cubic Bezier at t
  float t = a_quad.x;
  float mt = 1.0 - t;
  vec2 p = mt*mt*mt * a_start + 3.0*mt*mt*t * c1 + 3.0*mt*t*t * c2 + t*t*t * a_end;

  // Tangent for perpendicular offset
  vec2 tang = 3.0*mt*mt*(c1 - a_start) + 6.0*mt*t*(c2 - c1) + 3.0*t*t*(a_end - c2);
  float tlen = length(tang);
  vec2 tperp = tlen > 0.001 ? vec2(-tang.y, tang.x) / tlen : perp;

  vec2 pos = p + tperp * a_quad.y * u_width * 0.5;
  gl_Position = vec4(pos / u_resolution * 2.0 - 1.0, 0.0, 1.0);
  gl_Position.y = -gl_Position.y;
}
`,Qo=`#version 300 es
precision highp float;

in vec4 v_color;
out vec4 fragColor;

void main() {
  fragColor = v_color;
}
`;function ae(e,t,o){let n=e.createShader(t);return e.shaderSource(n,o),e.compileShader(n),e.getShaderParameter(n,e.COMPILE_STATUS)?n:(console.error("[GL] Shader compile:",e.getShaderInfoLog(n)),e.deleteShader(n),null)}function Se(e,t,o){let n=e.createProgram();return e.attachShader(n,t),e.attachShader(n,o),e.linkProgram(n),e.getProgramParameter(n,e.LINK_STATUS)?n:(console.error("[GL] Program link:",e.getProgramInfoLog(n)),e.deleteProgram(n),null)}function Jo(e){let t=ae(e,e.VERTEX_SHADER,Wo),o=ae(e,e.FRAGMENT_SHADER,Do);if(!t||!o)return null;let n=Se(e,t,o);if(!n)return null;n.u_resolution=e.getUniformLocation(n,"u_resolution");let s=ae(e,e.VERTEX_SHADER,Uo),r=ae(e,e.FRAGMENT_SHADER,No);if(!s||!r)return null;let i=Se(e,s,r);return i?(i.u_resolution=e.getUniformLocation(i,"u_resolution"),n._glow=i,n):null}function zo(e){let t=ae(e,e.VERTEX_SHADER,Yo),o=ae(e,e.FRAGMENT_SHADER,Zo);if(!t||!o)return null;let n=Se(e,t,o);return n?(n.u_resolution=e.getUniformLocation(n,"u_resolution"),n.u_gridSize=e.getUniformLocation(n,"u_gridSize"),n.u_pan=e.getUniformLocation(n,"u_pan"),n.u_lightMode=e.getUniformLocation(n,"u_lightMode"),n):null}function en(e){let t=ae(e,e.VERTEX_SHADER,Vo),o=ae(e,e.FRAGMENT_SHADER,jo);if(!t||!o)return null;let n=Se(e,t,o);return n?(n.u_resolution=e.getUniformLocation(n,"u_resolution"),n):null}function tn(e){let t=ae(e,e.VERTEX_SHADER,$o),o=ae(e,e.FRAGMENT_SHADER,qo);if(!t||!o)return null;let n=Se(e,t,o);return n?(n.u_density=e.getUniformLocation(n,"u_density"),n.u_maxW=e.getUniformLocation(n,"u_maxW"),n.u_lightMode=e.getUniformLocation(n,"u_lightMode"),n):null}function on(e){let t=e.createVertexArray();return e.bindVertexArray(t),e.bindBuffer(e.ARRAY_BUFFER,e._fsQuadVBO),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0),e.bindVertexArray(null),t}function nn(e,t,o){let n=Math.ceil(t/4),s=Math.ceil(o/4);if(e._heatW===n&&e._heatH===s)return;e._heatFBO&&e.deleteFramebuffer(e._heatFBO),e._heatTex&&e.deleteTexture(e._heatTex),e._heatTex=e.createTexture(),e.bindTexture(e.TEXTURE_2D,e._heatTex),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e._heatFBO=e.createFramebuffer(),e.bindFramebuffer(e.FRAMEBUFFER,e._heatFBO);let r=[{internal:e.RGBA16F,type:e.HALF_FLOAT,name:"RGBA16F"}];e._hasFloatLinear&&r.unshift({internal:e.RGBA32F,type:e.FLOAT,name:"RGBA32F"}),r.push({internal:e.RGBA8,type:e.UNSIGNED_BYTE,name:"RGBA8"});let i=!1;for(let a of r)if(e.texImage2D(e.TEXTURE_2D,0,a.internal,n,s,0,e.RGBA,a.type,null),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,e._heatTex,0),e.checkFramebufferStatus(e.FRAMEBUFFER)===e.FRAMEBUFFER_COMPLETE){a.name!=="RGBA32F"&&console.log(`[GL] Heatmap FBO using ${a.name}`),i=!0;break}i||(console.error("[GL] Heatmap FBO: no format works"),e._heatFBOBroken=!0),e.bindFramebuffer(e.FRAMEBUFFER,null),e._heatW=n,e._heatH=s}function Wt(e,t){let o=ae(e,e.VERTEX_SHADER,t),n=ae(e,e.FRAGMENT_SHADER,Qo);if(!o||!n)return null;let s=Se(e,o,n);return s?(s.u_resolution=e.getUniformLocation(s,"u_resolution"),s.u_width=e.getUniformLocation(s,"u_width"),s):null}function Dt(e,t){let o=e.createVertexArray();e.bindVertexArray(o),e.bindBuffer(e.ARRAY_BUFFER,t),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0);let n=32;return e.bindBuffer(e.ARRAY_BUFFER,e._instanceVBO),e.enableVertexAttribArray(1),e.vertexAttribPointer(1,2,e.FLOAT,!1,n,0),e.vertexAttribDivisor(1,1),e.enableVertexAttribArray(2),e.vertexAttribPointer(2,2,e.FLOAT,!1,n,8),e.vertexAttribDivisor(2,1),e.enableVertexAttribArray(3),e.vertexAttribPointer(3,4,e.FLOAT,!1,n,16),e.vertexAttribDivisor(3,1),e.bindVertexArray(null),o}function sn(e){let t=e.createVertexArray();e.bindVertexArray(t),e.bindBuffer(e.ARRAY_BUFFER,e._quadVBO),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0);let o=44;return e.bindBuffer(e.ARRAY_BUFFER,e._instanceVBO),e.enableVertexAttribArray(1),e.vertexAttribPointer(1,2,e.FLOAT,!1,o,0),e.vertexAttribDivisor(1,1),e.enableVertexAttribArray(2),e.vertexAttribPointer(2,1,e.FLOAT,!1,o,8),e.vertexAttribDivisor(2,1),e.enableVertexAttribArray(3),e.vertexAttribPointer(3,4,e.FLOAT,!1,o,12),e.vertexAttribDivisor(3,1),e.enableVertexAttribArray(4),e.vertexAttribPointer(4,4,e.FLOAT,!1,o,28),e.vertexAttribDivisor(4,1),e.bindVertexArray(null),t}var ht={};function mt(e){if(ht[e])return ht[e];let t=parseInt(e.slice(1,3),16)/255,o=parseInt(e.slice(3,5),16)/255,n=parseInt(e.slice(5,7),16)/255,s=[t,o,n];return ht[e]=s,s}function Le(e,t){return t.sizeLog?Math.log2(e+1):e}var dt=new Float32Array(0),ft=new Float32Array(0),pt=new Float32Array(0),gt=new Float32Array(0),we=new Float32Array(0);function Ee(e,t){return e.length>=t?e:new Float32Array(Math.max(t,e.length*2))}function rn(e){return(e*2654435761>>>0&2147483647)/2147483648}function an(e){return Math.min(5e3,Math.max(200,e*3))}function cn(e){let t=e.renderZoom,o=e.W,n=e.H,s=e.currentLevel===ie,r=e.selectedIds,i=r.size>0,a=e.hoveredId,u=Math.sqrt(o*o+n*n),c=u*1.2,d=c*c,p=u*.25,h=p*p,l=c-p,m,g,f,_,M,S,v;if(s)m=e.edges,g=e.nodes.length,f=L=>e.nodeIndexFull[L],_=L=>L.src,M=L=>L.dst,S=()=>1,v=L=>L;else{let L=e.getLevel(e.currentLevel);if(!L._snByBid){L._snByBid=new Map;for(let I of L.supernodes)L._snByBid.set(I.bid,I)}let B=L._snByBid;m=L.snEdges,g=L.supernodes.length,f=I=>B.get(I),_=I=>I.a,M=I=>I.b,S=I=>I.weight,v=I=>I}let x=an(g),y=m.length>x?x/m.length:1;dt=Ee(dt,Math.min(m.length,x)*8);let A=dt,w=0,E=0,b=s?100/255:124/255,R=s?100/255:106/255,F=s?140/255:247/255,H=s?.25:.4;for(let L=0;L<m.length;L++){let B=m[L],I=f(_(B)),C=f(M(B));if(!I||!C)continue;let j=I.x*t+e.pan.x,D=I.y*t+e.pan.y,Z=C.x*t+e.pan.x,N=C.y*t+e.pan.y,G=j-Z,W=D-N,T=G*G+W*W;if(T>d||y<1&&rn(L)>y*(2-T/d))continue;if(++E>x)break;let V=T<=h?1:Math.max(0,1-(Math.sqrt(T)-p)/l),X=S(B),K=s?H*V:Math.min(H,.05+X*.05)*V;if(K<.01)continue;let P=w*8;A[P]=j,A[P+1]=D,A[P+2]=Z,A[P+3]=N,A[P+4]=b,A[P+5]=R,A[P+6]=F,A[P+7]=K,w++}if(i||a!==null){ft=Ee(ft,m.length*8);let L=ft,B=0;for(let I=0;I<m.length;I++){let C=m[I],j=_(C),D=M(C),Z=r.has(j)||j===a,N=r.has(D)||D===a;if(!Z&&!N)continue;let G=f(j),W=f(D);if(!G||!W)continue;let T=G.x*t+e.pan.x,V=G.y*t+e.pan.y,X=W.x*t+e.pan.x,K=W.y*t+e.pan.y,P=r.has(j)||r.has(D)?.3:.15,$=B*8;L[$]=T,L[$+1]=V,L[$+2]=X,L[$+3]=K,L[$+4]=180/255,L[$+5]=180/255,L[$+6]=220/255,L[$+7]=P,B++}return{normalEdges:A.subarray(0,w*8),normalCount:w,hiliteEdges:L.subarray(0,B*8),hiliteCount:B}}return{normalEdges:A.subarray(0,w*8),normalCount:w,hiliteEdges:new Float32Array(0),hiliteCount:0}}function ln(e){let t=e.renderZoom,o=e.W,n=e.H,s=e.currentLevel===ie,r=e.selectedIds,i=e.hoveredId,a,u,c,d,p;if(s)a=e.nodes,u=Math.min(o,n)*t/256,c=A=>e._nodeColor(A),d=A=>A.id,p=A=>e.sizeBy==="edges"?A.degree:1;else{a=e.getLevel(e.currentLevel).supernodes;let w=1<<se[e.currentLevel];u=Math.min(o,n)*t/w,c=E=>E.cachedColor,d=E=>E.bid,p=E=>e.sizeBy==="edges"?E.totalDegree:E.members.length}let h=s?Math.max(1,Math.min(u*.4,20)):Math.max(1.5,Math.min(u*.42,40)),l=s?1:1.5,m=s?1:1.2,g=e.pan.x+"|"+e.pan.y+"|"+t+"|"+e.sizeBy+"|"+e.sizeLog+"|"+e.currentLevel;if(e._glVisKey!==g){let A=0,w=1,E=u*.5;for(let b=0;b<a.length;b++){let R=a[b],F=R.x*t+e.pan.x,H=R.y*t+e.pan.y;if(F>=-E&&F<=o+E&&H>=-E&&H<=n+E){A++;let L=Le(p(R),e);L>w&&(w=L)}}e._glVisKey=g,e._glVisCount=A,e._glMaxSize=w}let f=e._glVisCount,_=e._glMaxSize;pt=Ee(pt,a.length*11);let M=pt,S=r.size+(i!==null?1:0);gt=Ee(gt,Math.max(1,S)*11);let v=gt,x=0,y=0;for(let A=0;A<a.length;A++){let w=a[A],E=w.x*t+e.pan.x,b=w.y*t+e.pan.y;if(E<-h||E>o+h||b<-h||b>n+h)continue;let R=p(w),F=Le(R,e),H=Math.max(l,Math.min(h,l+Math.sqrt(F)*m)),L=c(w),B=mt(L),I=d(w),C=r.has(I),j=i===I,D=f>50?.3+.7*Math.sqrt(F/_):1,Z,N;s?(Z=C?1:j?.8:187/255,N=C?1:0):(Z=C?1:j?.8:D*153/255,N=C||j?1:D);let G=x*11;if(M[G]=E,M[G+1]=b,M[G+2]=H,M[G+3]=B[0],M[G+4]=B[1],M[G+5]=B[2],M[G+6]=Z,M[G+7]=C?1:B[0],M[G+8]=C?1:B[1],M[G+9]=C?1:B[2],M[G+10]=N,x++,C||j){let W=H*(s?3:2.5),T=y*11;v[T]=E,v[T+1]=b,v[T+2]=W,v[T+3]=B[0],v[T+4]=B[1],v[T+5]=B[2],v[T+6]=C?.27:.2,v[T+7]=0,v[T+8]=0,v[T+9]=0,v[T+10]=0,y++}}return{circles:M.subarray(0,x*11),circleCount:x,glows:v.subarray(0,y*11),glowCount:y}}function un(e){let t=e.renderZoom,o=e.W,n=e.H,s=e.currentLevel===ie,r=s?e.nodes:e.getLevel(e.currentLevel).supernodes,i=4,a=Math.ceil(o/i),u=Math.ceil(n/i),c=Math.max(8,Math.min(40,Math.min(a,u)/8));we=Ee(we,r.length*11);let d=we,p=0;for(let h=0;h<r.length;h++){let l=r[h],m=l.x*t+e.pan.x,g=l.y*t+e.pan.y,f=m/i,_=g/i;if(f<-c||f>a+c||_<-c||_>u+c)continue;let M;s?M=Le(e.sizeBy==="edges"?l.degree+1:1,e):M=Le(e.sizeBy==="edges"?l.totalDegree+1:l.members.length,e);let S=s?e._nodeColor(l):l.cachedColor,v=mt(S),x=p*11;d[x]=f,d[x+1]=_,d[x+2]=c,d[x+3]=v[0],d[x+4]=v[1],d[x+5]=v[2],d[x+6]=M,d[x+7]=0,d[x+8]=0,d[x+9]=0,d[x+10]=0,p++}return{data:d.subarray(0,p*11),count:p,gw:a,gh:u,kernelR:c}}var _e=null;function hn(e,t,o,n,s){let r=s*s,i=o*n;(!_e||_e.length<i)&&(_e=new Float32Array(Math.max(i,1))),_e.fill(0,0,i);for(let u=0;u<t;u++){let c=u*11,d=e[c],p=e[c+1],h=e[c+6],l=Math.max(0,d-s|0),m=Math.min(o-1,d+s+1|0),g=Math.max(0,p-s|0),f=Math.min(n-1,p+s+1|0);for(let _=g;_<=f;_++){let M=_-p,S=M*M,v=_*o;for(let x=l;x<=m;x++){let y=x-d,A=y*y+S;if(A>r)continue;let w=1-A/r;_e[v+x]+=w*w*h}}}let a=0;for(let u=0;u<i;u++)_e[u]>a&&(a=_e[u]);return a}function dn(e){return e.currentLevel+"|"+e.renderZoom.toFixed(1)+"|"+e.sizeBy+"|"+e.sizeLog+"|"+e.W+"|"+e.H+"|"+(e._blendGen||0)}function fn(e,t){let o=t.W,n=t.H;if(nn(e,o,n),e._heatFBOBroken)return;let s=e._heatW,r=e._heatH,{data:i,count:a,gw:u,gh:c,kernelR:d}=un(t);if(a===0)return;e.bindFramebuffer(e.FRAMEBUFFER,e._heatFBO),e.viewport(0,0,s,r),e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT),e.enable(e.BLEND),e.blendFunc(e.ONE,e.ONE),e.useProgram(e._heatSplatProg),e.uniform2f(e._heatSplatProg.u_resolution,u,c),e.bindVertexArray(e._circleVAO),e.bindBuffer(e.ARRAY_BUFFER,e._instanceVBO),e.bufferData(e.ARRAY_BUFFER,i,e.DYNAMIC_DRAW),e.drawArraysInstanced(e.TRIANGLE_STRIP,0,4,a),e.bindFramebuffer(e.FRAMEBUFFER,null);let p=dn(t);if(p!==e._heatMaxWKey){let m=hn(i,a,u,c,d);e._heatMaxWTarget=m||1,e._heatMaxWKey=p,e._heatMaxWTime=performance.now(),e._heatMaxW===0&&(e._heatMaxW=e._heatMaxWTarget)}let h=performance.now()-e._heatMaxWTime,l=1-Math.exp(-h/200);if(e._heatMaxW+=(e._heatMaxWTarget-e._heatMaxW)*l,e._heatMaxWTime=performance.now(),e._heatMaxW<.001){e.viewport(0,0,o,n);return}e.viewport(0,0,o,n),e.blendFunc(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA),e.useProgram(e._heatResolveProg),e.uniform1i(e._heatResolveProg.u_density,0),e.uniform1f(e._heatResolveProg.u_maxW,e._heatMaxW),e.uniform1f(e._heatResolveProg.u_lightMode,t._lightMode?1:0),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,e._heatTex),e.bindVertexArray(e._heatResolveVAO),e.drawArrays(e.TRIANGLE_STRIP,0,4),e.disable(e.BLEND),Math.abs(e._heatMaxW-e._heatMaxWTarget)>e._heatMaxWTarget*.01&&t.render()}function pn(e){let t=e.renderZoom,o=e.W,n=e.H,s=e.currentLevel===ie,r=s?e.nodes:e.getLevel(e.currentLevel).supernodes;we=Ee(we,r.length*11);let i=we,a=0;for(let u=0;u<r.length;u++){let c=r[u],d=c.x*t+e.pan.x,p=c.y*t+e.pan.y,h=s?200:400;if(d<-h||d>o+h||p<-h||p>n+h)continue;let l;s?l=Le(e.sizeBy==="edges"?c.degree+1:1,e):l=Le(e.sizeBy==="edges"?c.totalDegree+1:c.members.length,e);let m=Math.max(50,Math.min(h,50+Math.sqrt(l)*25)),g=s?e._nodeColor(c):c.cachedColor,f=mt(g),_=a*11;i[_]=d,i[_+1]=p,i[_+2]=m,i[_+3]=f[0],i[_+4]=f[1],i[_+5]=f[2],i[_+6]=e._lightMode?.3:.15,i[_+7]=0,i[_+8]=0,i[_+9]=0,i[_+10]=0,a++}return{data:i.subarray(0,a*11),count:a}}function gn(e,t){let o=t.W,n=t.H,{data:s,count:r}=pn(t);if(r===0)return;e.enable(e.BLEND),t._lightMode?e.blendFunc(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA):e.blendFunc(e.SRC_ALPHA,e.ONE);let i=e._circleProgram._glow;e.useProgram(i),e.uniform2f(i.u_resolution,o,n),e.bindVertexArray(e._circleVAO),e.bindBuffer(e.ARRAY_BUFFER,e._instanceVBO),e.bufferData(e.ARRAY_BUFFER,s,e.DYNAMIC_DRAW),e.drawArraysInstanced(e.TRIANGLE_STRIP,0,4,r),e.blendFunc(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA),e.disable(e.BLEND)}function Nt(e,t){let o=t.W,n=t.H;if(o<=0||n<=0)return;e.viewport(0,0,o,n),e._clearR!==void 0?e.clearColor(e._clearR,e._clearG,e._clearB,1):e.clearColor(10/255,10/255,15/255,1),e.clear(e.COLOR_BUFFER_BIT),e.enable(e.BLEND),e.blendFunc(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA);let s=40*t.renderZoom;if(s>=4&&(e.useProgram(e._gridProgram),e.uniform2f(e._gridProgram.u_resolution,o,n),e.uniform1f(e._gridProgram.u_gridSize,s),e.uniform2f(e._gridProgram.u_pan,t.pan.x%s,t.pan.y%s),e.uniform1f(e._gridProgram.u_lightMode,t._lightMode?1:0),e.bindVertexArray(e._heatResolveVAO),e.drawArrays(e.TRIANGLE_STRIP,0,4)),!t.nodes||t.nodes.length===0){e.disable(e.BLEND);return}let r=t.edgeMode!=="none"?cn(t):null,i=t.edgeMode==="curves",a=i?e._edgeCurveProgram:e._edgeLineProgram,u=i?e._edgeCurveVAO:e._edgeLineVAO,c=i?(e._curveSegCount+1)*2:4;r&&r.normalCount>0&&(e.useProgram(a),e.uniform2f(a.u_resolution,o,n),e.uniform1f(a.u_width,1),e.bindVertexArray(u),e.bindBuffer(e.ARRAY_BUFFER,e._instanceVBO),e.bufferData(e.ARRAY_BUFFER,r.normalEdges,e.DYNAMIC_DRAW),e.drawArraysInstanced(e.TRIANGLE_STRIP,0,c,r.normalCount)),t.heatmapMode==="density"?(fn(e,t),e.enable(e.BLEND),e.blendFunc(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA)):t.heatmapMode==="splat"&&(gn(e,t),e.enable(e.BLEND),e.blendFunc(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA)),r&&r.hiliteCount>0&&(e.useProgram(a),e.uniform2f(a.u_resolution,o,n),e.uniform1f(a.u_width,2),e.bindVertexArray(u),e.bindBuffer(e.ARRAY_BUFFER,e._instanceVBO),e.bufferData(e.ARRAY_BUFFER,r.hiliteEdges,e.DYNAMIC_DRAW),e.drawArraysInstanced(e.TRIANGLE_STRIP,0,c,r.hiliteCount));let{circles:d,circleCount:p,glows:h,glowCount:l}=ln(t);if(p>0){if(l>0){let m=e._circleProgram._glow;e.useProgram(m),e.uniform2f(m.u_resolution,o,n),e.bindVertexArray(e._circleVAO),e.bindBuffer(e.ARRAY_BUFFER,e._instanceVBO),e.bufferData(e.ARRAY_BUFFER,h,e.DYNAMIC_DRAW),e.drawArraysInstanced(e.TRIANGLE_STRIP,0,4,l)}e.useProgram(e._circleProgram),e.uniform2f(e._circleProgram.u_resolution,o,n),e.bindVertexArray(e._circleVAO),e.bindBuffer(e.ARRAY_BUFFER,e._instanceVBO),e.bufferData(e.ARRAY_BUFFER,d,e.DYNAMIC_DRAW),e.drawArraysInstanced(e.TRIANGLE_STRIP,0,4,p)}e.disable(e.BLEND),e.bindVertexArray(null)}var Vt={dark:{grid:"rgba(60,60,100,0.6)",labelBright:"#fff",labelHover:"rgba(230,230,255,0.95)",labelNeighbor:"rgba(210,210,245,0.8)",labelDim:"rgba(220,220,255,0.85)",labelRawDim:"rgba(200,200,220,0.75)",countFill:"#ffffffcc",shadowColor:"rgba(0,0,0,0.9)",shadowNeighbor:"rgba(0,0,0,0.85)",legendBg:"rgba(10, 10, 15, 0.75)",legendText:"#c8c8d8",legendOverflow:"#8888a0",resetBg:"rgba(10, 10, 15, 0.65)",resetText:"#8888a0",fpsFill:"rgba(200,200,220,0.6)"},light:{grid:"rgba(100,100,140,0.25)",labelBright:"#111",labelHover:"rgba(30,30,60,0.9)",labelNeighbor:"rgba(40,40,80,0.75)",labelDim:"rgba(50,50,80,0.8)",labelRawDim:"rgba(60,60,90,0.7)",countFill:"rgba(20,20,40,0.85)",shadowColor:"rgba(255,255,255,0.9)",shadowNeighbor:"rgba(255,255,255,0.85)",legendBg:"rgba(255, 255, 255, 0.85)",legendText:"#333340",legendOverflow:"#6a6a80",resetBg:"rgba(255, 255, 255, 0.75)",resetText:"#6a6a80",fpsFill:"rgba(60,60,80,0.6)"}};function re(e){return e._lightMode?Vt.light:Vt.dark}function Zt(e){return Math.min(5e3,Math.max(200,e*3))}var _t={};function Kt(e){if(_t[e])return _t[e];let t=parseInt(e.slice(1,3),16),o=parseInt(e.slice(3,5),16),n=parseInt(e.slice(5,7),16),s={r:t,g:o,b:n};return _t[e]=s,s}var yt={};function Be(e,t){let o=t?-e:e;if(yt[o])return yt[o];let n=t?`bold ${e}px JetBrains Mono`:`${e}px JetBrains Mono`;return yt[o]=n,n}var Xt=new Array(256);for(let e=0;e<256;e++)Xt[e]=e.toString(16).padStart(2,"0");var xt={};function de(e,t,o,n){let s=(e<<24|t<<16|o<<8|n*255|0)>>>0;if(xt[s])return xt[s];let r=`rgba(${e},${t},${o},${n})`;return xt[s]=r,r}function Qt(e){return(e*2654435761>>>0&2147483647)/2147483648}function xe(e,t){return t.sizeLog?Math.log2(e+1):e}var Xe="curves";function vt(e){Xe=e}function Qe(e,t,o,n,s){if(Xe==="lines"){e.moveTo(t,o),e.lineTo(n,s);return}let r=n-t,i=s-o,a=Math.sqrt(r*r+i*i);if(a<1){e.moveTo(t,o),e.lineTo(n,s);return}let u=-i/a,c=r/a,d=t+r*.3+u*a*.15,p=o+i*.3+c*a*.15,h=t+r*.7+u*a*.05,l=o+i*.7+c*a*.05;e.moveTo(t,o),e.bezierCurveTo(d,p,h,l,n,s)}function Jt(e,t,o){return{x:t*e.renderZoom+e.pan.x,y:o*e.renderZoom+e.pan.y}}function zt(e,t,o){return{x:(t-e.pan.x)/e.renderZoom,y:(o-e.pan.y)/e.renderZoom}}function eo(e){let t=e.currentLevel===ie,o=t?e.nodes:e.getLevel(e.currentLevel).supernodes;if(o.length===0)return;let n=1/0,s=-1/0,r=1/0,i=-1/0;for(let g=0;g<o.length;g++){let f=o[g],_=f.ax!==void 0?f.ax:f.px,M=f.ay!==void 0?f.ay:f.py;_<n&&(n=_),_>s&&(s=_),M<r&&(r=M),M>i&&(i=M)}n<-3&&(n=-3),s>3&&(s=3),r<-3&&(r=-3),i>3&&(i=3);let a=s-n||1,u=i-r||1,c=Math.max(40,Math.min(100,Math.min(e.W,e.H)*.08)),d=e.W-c*2,p=e.H-c*2,h=Math.min(d/a,p/u),l=c+(d-a*h)/2,m=c+(p-u*h)/2;if(e._layoutScale=h,e._layoutOffX=l,e._layoutOffY=m,e._layoutMinX=n,e._layoutMinY=r,t)for(let g=0;g<e.nodes.length;g++){let f=e.nodes[g],_=Math.max(n,Math.min(s,f.px)),M=Math.max(r,Math.min(i,f.py));f.x=l+(_-n)*h,f.y=m+(M-r)*h}else{let g=e.getLevel(e.currentLevel).supernodes;for(let f=0;f<g.length;f++){let _=g[f],M=Math.max(n,Math.min(s,_.ax)),S=Math.max(r,Math.min(i,_.ay));_.x=l+(M-n)*h,_.y=m+(S-r)*h}}}function Je(e){let t=e.ctx,o=e.W,n=e.H;t.clearRect(0,0,o,n);let s=!!e._gl,i=e.currentLevel===ie?_n:mn;if(!s){t.strokeStyle=re(e).grid,t.lineWidth=.5;let a=40*e.renderZoom;if(a>=4){let c=e.pan.x%a,d=e.pan.y%a;t.beginPath();for(let p=c;p<o;p+=a)t.moveTo(p,0),t.lineTo(p,n);for(let p=d;p<n;p+=a)t.moveTo(0,p),t.lineTo(o,p);t.stroke()}vt(e.edgeMode),e.edgeMode!=="none"&&i(e,"edges"),e.heatmapMode==="splat"?yn(e):e.heatmapMode==="density"&&Mn(e);let u=Xe;Xe==="none"&&vt("lines"),i(e,"hilite"),vt(u),i(e,"circles")}i(e,"labels"),e.showLegend&&An(e),e.showResetBtn&&wn(e)}function mn(e,t){let o=e.ctx,n=e.getLevel(e.currentLevel),{supernodes:s,snEdges:r}=n;if(!n._snByBid){n._snByBid=new Map;for(let x of s)n._snByBid.set(x.bid,x)}let i=n._snByBid,a=Math.sqrt(e.W*e.W+e.H*e.H),u=a*1.2,c=u*u,d=a*.25,p=u-d,h=e.renderZoom,l=e.selectedIds,m=l.size>0,g=e.hoveredId;if(t==="edges"){let x=Zt(s.length),y=r.length>x?x/r.length:1,A=0,w=10,E=new Array(w);for(let R=0;R<w;R++)E[R]=[];let b=d*d;for(let R=0;R<r.length;R++){let F=r[R],H=i.get(F.a),L=i.get(F.b);if(!H||!L)continue;let B=H.x*h+e.pan.x,I=H.y*h+e.pan.y,C=L.x*h+e.pan.x,j=L.y*h+e.pan.y,D=B-C,Z=I-j,N=D*D+Z*Z;if(N>c||y<1&&Qt(R)>y*(2-N/c))continue;if(++A>x)break;let G=N<=b?1:Math.max(0,1-(Math.sqrt(N)-d)/p),W=Math.min(.4,.05+F.weight*.05)*G;if(W<.01)continue;let T=Math.min(w-1,W/.4*w|0);E[T].push(B,I,C,j)}for(let R=0;R<w;R++){let F=E[R];if(F.length===0)continue;let H=((R+.5)/w*40|0)/100;o.strokeStyle=de(124,106,247,H),o.lineWidth=1,o.beginPath();for(let L=0;L<F.length;L+=4)Qe(o,F[L],F[L+1],F[L+2],F[L+3]);o.stroke()}return}let f=1<<se[e.currentLevel],_=Math.min(e.W,e.H)*h/f;if(t==="hilite"){if(m||g!==null)for(let x=0;x<r.length;x++){let y=r[x],A=l.has(y.a)||y.a===g,w=l.has(y.b)||y.b===g;if(!A&&!w)continue;let E=i.get(y.a),b=i.get(y.b);if(!E||!b)continue;let R=E.x*h+e.pan.x,F=E.y*h+e.pan.y,H=b.x*h+e.pan.x,L=b.y*h+e.pan.y;o.strokeStyle=l.has(y.a)||l.has(y.b)?"rgba(180,180,220,0.3)":"rgba(180,180,220,0.15)",o.lineWidth=Math.min(4,1+y.weight*.4),o.beginPath(),Qe(o,R,F,H,L),o.stroke()}return}let M=e.pan.x+"|"+e.pan.y+"|"+h+"|"+e.sizeBy+"|"+e.sizeLog;if(n._visKey!==M){let x=0,y=1,A=_*.5;for(let w=0;w<s.length;w++){let E=s[w],b=E.x*h+e.pan.x,R=E.y*h+e.pan.y;if(b>=-A&&b<=e.W+A&&R>=-A&&R<=e.H+A){x++;let F=xe(e.sizeBy==="edges"?E.totalDegree:E.members.length,e);F>y&&(y=F)}}n._visKey=M,n._visibleCount=x,n._maxSizeVal=y}let S=n._visibleCount,v=n._maxSizeVal;for(let x=0;x<s.length;x++){let y=s[x],A=y.x*h+e.pan.x,w=y.y*h+e.pan.y,E=Math.max(1.5,Math.min(_*.42,40));if(A<-E||A>e.W+E||w<-E||w>e.H+E)continue;let b=e.sizeBy==="edges"?y.totalDegree:y.members.length,R=xe(b,e),F=Math.max(1.5,Math.min(E,1.5+Math.sqrt(R)*1.2)),H=y.cachedColor,L=l.has(y.bid),B=g===y.bid,I=S>50?.3+.7*Math.sqrt(R/v):1;if(t==="circles"){if(L||B){let C=o.createRadialGradient(A,w,0,A,w,F*2.5);C.addColorStop(0,H+"44"),C.addColorStop(1,H+"00"),o.fillStyle=C,o.beginPath(),o.arc(A,w,F*2.5,0,Math.PI*2),o.fill()}o.fillStyle=H+(L?"ff":B?"cc":Xt[Math.round(I*153)]),o.beginPath(),o.arc(A,w,F,0,Math.PI*2),o.fill(),o.strokeStyle=L?"#fff":H,o.lineWidth=L?2:1,o.globalAlpha=L||B?1:I,o.stroke(),o.globalAlpha=1}if(t==="labels"){if(!n._hlNeighbors||n._hlKey!==""+[...l]+"|"+g){let N=Math.max(5,Math.min(20,Math.floor(Math.min(e.W,e.H)/40))),G=[];if(m||g!==null)for(let T=0;T<r.length;T++){let V=r[T];(l.has(V.a)||V.a===g)&&G.push({id:V.b,w:V.weight}),(l.has(V.b)||V.b===g)&&G.push({id:V.a,w:V.weight})}G.sort((T,V)=>V.w-T.w);let W=new Set;for(let T=0;T<Math.min(G.length,N);T++)W.add(G[T].id);n._hlNeighbors=W,n._hlKey=""+[...l]+"|"+g}let j=n._hlNeighbors.has(y.bid)&&I>.5;if((L||B)&&_>=10&&F>=3){let N=Math.max(7,Math.min(13,F*1))|0;o.fillStyle=re(e).countFill,o.font=Be(N,!0),o.textAlign="center",o.textBaseline="middle",o.fillText(b,A,w)}if(L||B||j||S<=50&&_>=20||S<=150&&I>.7&&_>=20){let N=y.cachedLabel,G=N.split(" \xB7 "),W=G.length>1&&e.labelProps.has("label");if(L||B){let T=Math.max(11,Math.min(12,_*.18))|0;o.font=Be(T,!0),o.textAlign="center",o.shadowColor=re(e).shadowColor,o.shadowBlur=10,o.fillStyle=L?re(e).labelBright:re(e).labelHover,W?(o.textBaseline="bottom",o.fillText(G[0],A,w-F-3),o.textBaseline="top",o.fillText(G.slice(1).join(" \xB7 "),A,w+F+3)):(o.textBaseline="bottom",o.fillText(N,A,w-F-3)),o.shadowBlur=0}else if(j){let T=Math.max(10,Math.min(12,_*.18))|0,V=20;if(o.font=Be(T,!1),o.textAlign="center",o.shadowColor=re(e).shadowNeighbor,o.shadowBlur=10,o.fillStyle=re(e).labelNeighbor,W){let X=G[0].length>V?G[0].slice(0,V-1)+"\u2026":G[0];o.textBaseline="bottom",o.fillText(X,A,w-F-3);let K=G.slice(1).join(" \xB7 "),P=K.length>V?K.slice(0,V-1)+"\u2026":K;o.textBaseline="top",o.fillText(P,A,w+F+3)}else{let X=N.length>V?N.slice(0,V-1)+"\u2026":N;o.textBaseline="bottom",o.fillText(X,A,w-F-3)}o.shadowBlur=0}else{let T=Math.max(10,Math.min(13,_*.18))|0,V=T*.6,X=Math.max(3,_/V|0);if(o.fillStyle=re(e).labelDim,o.font=Be(T,!1),o.textAlign="center",W){let K=G[0].length>X?G[0].slice(0,X-1)+"\u2026":G[0];o.textBaseline="bottom",o.fillText(K,A,w-F-3);let P=G.slice(1).join(" \xB7 "),$=P.length>X?P.slice(0,X-1)+"\u2026":P;o.textBaseline="top",o.fillText($,A,w+F+3)}else{let K=N.length>X?N.slice(0,X-1)+"\u2026":N;o.textBaseline="bottom",o.fillText(K,A,w-F-3)}}}}}}function _n(e,t){let o=e.ctx,n=e.renderZoom,s=Math.min(e.W,e.H)*n/256,r=Math.sqrt(e.W*e.W+e.H*e.H),i=r*1.2,a=i*i,u=r*.25,c=i-u,d=e.selectedIds,p=d.size>0,h=e.hoveredId;if(t==="edges"){let l=Zt(e.nodes.length),m=e.edges.length>l?l/e.edges.length:1,g=0,f=10,_=new Array(f);for(let S=0;S<f;S++)_[S]=[];let M=u*u;for(let S=0;S<e.edges.length;S++){let v=e.edges[S],x=e.nodeIndexFull[v.src],y=e.nodeIndexFull[v.dst];if(!x||!y)continue;let A=x.x*n+e.pan.x,w=x.y*n+e.pan.y,E=y.x*n+e.pan.x,b=y.y*n+e.pan.y,R=A-E,F=w-b,H=R*R+F*F;if(H>a||m<1&&Qt(S)>m*(2-H/a))continue;if(++g>l)break;let B=.25*(H<=M?1:Math.max(0,1-(Math.sqrt(H)-u)/c));if(B<.01)continue;let I=Math.min(f-1,B/.25*f|0);_[I].push(A,w,E,b)}o.lineWidth=.8;for(let S=0;S<f;S++){let v=_[S];if(v.length===0)continue;let x=((S+.5)/f*25|0)/100;o.strokeStyle=de(100,100,140,x),o.beginPath();for(let y=0;y<v.length;y+=4)Qe(o,v[y],v[y+1],v[y+2],v[y+3]);o.stroke()}return}if(t==="hilite"){if(p||h!==null)for(let l=0;l<e.edges.length;l++){let m=e.edges[l],g=d.has(m.src)||m.src===h,f=d.has(m.dst)||m.dst===h;if(!g&&!f)continue;let _=e.nodeIndexFull[m.src],M=e.nodeIndexFull[m.dst];if(!_||!M)continue;let S=_.x*n+e.pan.x,v=_.y*n+e.pan.y,x=M.x*n+e.pan.x,y=M.y*n+e.pan.y;o.strokeStyle=d.has(m.src)||d.has(m.dst)?"rgba(180,180,220,0.3)":"rgba(180,180,220,0.15)",o.lineWidth=d.has(m.src)||d.has(m.dst)?1.5:1,o.beginPath(),Qe(o,S,v,x,y),o.stroke()}return}for(let l=0;l<e.nodes.length;l++){let m=e.nodes[l],g=m.x*n+e.pan.x,f=m.y*n+e.pan.y,_=Math.max(1,Math.min(s*.4,20));if(g<-_||g>e.W+_||f<-_||f>e.H+_)continue;let M=xe(e.sizeBy==="edges"?m.degree:1,e),S=Math.max(1,Math.min(_,1+Math.sqrt(M)*1)),v=e._nodeColor(m),x=d.has(m.id),y=h===m.id;if(t==="circles"){if(x||y){let A=o.createRadialGradient(g,f,0,g,f,S*3);A.addColorStop(0,v+"66"),A.addColorStop(1,v+"00"),o.fillStyle=A,o.beginPath(),o.arc(g,f,S*3,0,Math.PI*2),o.fill()}o.fillStyle=v+(x?"ff":"bb"),o.beginPath(),o.arc(g,f,S,0,Math.PI*2),o.fill(),x&&(o.strokeStyle="#fff",o.lineWidth=1.5,o.stroke())}if(t==="labels"){if(!e._rawHlNeighbors||e._rawHlKey!==""+[...d]+"|"+h){let E=Math.max(5,Math.min(20,Math.floor(Math.min(e.W,e.H)/40))),b={};if(p||h!==null)for(let H=0;H<e.edges.length;H++){let L=e.edges[H];(d.has(L.src)||L.src===h)&&(b[L.dst]=(b[L.dst]||0)+1),(d.has(L.dst)||L.dst===h)&&(b[L.src]=(b[L.src]||0)+1)}let R=Object.keys(b).sort((H,L)=>b[L]-b[H]),F=new Set(R.slice(0,E));e._rawHlNeighbors=F,e._rawHlKey=""+[...d]+"|"+h}let w=e._rawHlNeighbors.has(m.id)&&m.degree>=3;if(x||y||w||s>=14){let E=e._nodeLabel(m);if(x||y){let b=Math.max(11,Math.min(12,s*.22))|0;o.fillStyle=x?"#fff":"rgba(230,230,255,0.95)",o.font=Be(b,!0),o.textAlign="left",o.textBaseline="middle",o.fillText(E,g+S+3,f)}else{let b=Math.max(10,Math.min(13,s*.22))|0,R=b*.6,F=Math.max(4,s*.8/R|0),H=E.length>F?E.slice(0,F-1)+"\u2026":E;o.fillStyle=re(e).labelRawDim,o.font=Be(b,!1),o.textAlign="left",o.textBaseline="middle",o.fillText(H,g+S+3,f)}}}}}function yn(e){let t=e.ctx,o=e.W,n=e.H,s=e.renderZoom,r=e.currentLevel===ie,i=r?e.nodes:e.getLevel(e.currentLevel).supernodes,a=e._lightMode;t.save(),a?(t.globalCompositeOperation="source-over",t.globalAlpha=.5):(t.globalCompositeOperation="lighter",t.globalAlpha=.6);for(let u=0;u<i.length;u++){let c=i[u],d=c.x*s+e.pan.x,p=c.y*s+e.pan.y,h=r?200:400;if(d<-h||d>o+h||p<-h||p>n+h)continue;let l;r?l=xe(e.sizeBy==="edges"?c.degree+1:1,e):l=xe(e.sizeBy==="edges"?c.totalDegree+1:c.members.length,e);let m=Math.max(50,Math.min(h,50+Math.sqrt(l)*25)),g=r?e._nodeColor(c):c.cachedColor,f=Kt(g),_=t.createRadialGradient(d,p,0,d,p,m);a?(_.addColorStop(0,de(f.r,f.g,f.b,.4)),_.addColorStop(.5,de(f.r,f.g,f.b,.15)),_.addColorStop(1,de(f.r,f.g,f.b,0))):(_.addColorStop(0,de(f.r,f.g,f.b,.25)),_.addColorStop(.5,de(f.r,f.g,f.b,.08)),_.addColorStop(1,de(f.r,f.g,f.b,0))),t.fillStyle=_,t.beginPath(),t.arc(d,p,m,0,Math.PI*2),t.fill()}t.restore()}var jt=0,$t=0,qe=null,Ye=null,Ze=null,be=null,Mt=null,At=null,ye=0,Ke=0,qt="",wt=0,xn=0,Yt=0;function vn(e){return e._densityId||(e._densityId=++xn),e._densityId+"|"+e.currentLevel+"|"+e.renderZoom.toFixed(1)+"|"+e.sizeBy+"|"+e.sizeLog+"|"+e.W+"|"+e.H}function Mn(e){let t=e.W,o=e.H,n=e.renderZoom,s=e.currentLevel===ie,r=s?e.nodes:e.getLevel(e.currentLevel).supernodes,i=4,a=Math.ceil(t/i),u=Math.ceil(o/i),c=a*u;(a!==jt||u!==$t)&&(jt=a,$t=u,qe=new Float32Array(c),Ye=new Float32Array(c),Ze=new Float32Array(c),be=new Float32Array(c),Mt=new ImageData(a,u),At=new OffscreenCanvas(a,u)),qe.fill(0),Ye.fill(0),Ze.fill(0),be.fill(0);let d=Math.max(8,Math.min(40,Math.min(a,u)/8)),p=d*d,h=vn(e),l=h!==qt;for(let v=0;v<r.length;v++){let x=r[v],y=(x.x*n+e.pan.x)/i,A=(x.y*n+e.pan.y)/i;if(y<-d||y>a+d||A<-d||A>u+d)continue;let w;s?w=xe(e.sizeBy==="edges"?x.degree+1:1,e):w=xe(e.sizeBy==="edges"?x.totalDegree+1:x.members.length,e);let E=s?e._nodeColor(x):x.cachedColor,b=Kt(E),R=Math.max(0,y-d|0),F=Math.min(a-1,y+d+1|0),H=Math.max(0,A-d|0),L=Math.min(u-1,A+d+1|0);for(let B=H;B<=L;B++){let I=B-A,C=I*I,j=B*a;for(let D=R;D<=F;D++){let Z=D-y,N=Z*Z+C;if(N>p)continue;let G=1-N/p,W=G*G*w,T=j+D;qe[T]+=b.r*W,Ye[T]+=b.g*W,Ze[T]+=b.b*W,be[T]+=W}}}if(l){let v=0;for(let y=0;y<c;y++)be[y]>v&&(v=be[y]);Ke=v,qt=h,wt=performance.now();let x=e._densityId!==Yt;Yt=e._densityId,(ye===0||x)&&(ye=v)}let m=performance.now()-wt,g=1-Math.exp(-m/200);if(ye+=(Ke-ye)*g,wt=performance.now(),ye<.001)return;let f=Mt.data,_=1/(ye*.3),M=e._lightMode;for(let v=0;v<c;v++){let x=be[v];if(x<.001){f[v*4+3]=0;continue}let y=Math.min(1,x*_),A=y/x,w=v*4,E=Math.min(255,qe[v]*A+.5|0),b=Math.min(255,Ye[v]*A+.5|0),R=Math.min(255,Ze[v]*A+.5|0);M?(f[w]=255-(255-E)*y+.5|0,f[w+1]=255-(255-b)*y+.5|0,f[w+2]=255-(255-R)*y+.5|0,f[w+3]=Math.min(255,y*220+.5|0)):(f[w]=E,f[w+1]=b,f[w+2]=R,f[w+3]=Math.min(255,y*180+.5|0))}At.getContext("2d").putImageData(Mt,0,0),e.ctx.save(),e.ctx.imageSmoothingEnabled=!0,e.ctx.imageSmoothingQuality="high",e.ctx.drawImage(At,0,0,t,o),e.ctx.restore(),Math.abs(ye-Ke)>Ke*.01&&e.render()}function An(e){let t=e._cachedColorMap;if(!t)return;let o=Object.entries(t);if(o.length===0)return;let n=e.currentLevel===ie,s=n?e.nodes:e.getLevel(e.currentLevel).supernodes,r={};for(let b of s){let R=n?e._nodeColorVal(b):b.cachedColorVal||"";r[R]=(r[R]||0)+1}o.sort((b,R)=>(r[R[0]]||0)-(r[b[0]]||0));let a=o.slice(0,12),u=o.length-a.length,c=e.ctx,d=10,p=4,h=16,l=8,m=90;c.font=`${d}px JetBrains Mono, monospace`;let g=0;for(let[b]of a){let R=c.measureText(b.length>14?b.slice(0,13)+"\u2026":b).width;R>g&&(g=R)}g=Math.min(g,m);let f=e._cachedDominant.toUpperCase();c.font="bold 8px JetBrains Mono, monospace";let _=c.measureText(f).width,M=14,S=a.length+(u>0?1:0),v=Math.max(p*2+6+g,_)+l*2,x=M+S*h+l*2,y=8,A=e.showLegend||1,w=A===2||A===3?y:e.W-v-y,E=A===3||A===4?y:e.H-x-y;c.fillStyle=re(e).legendBg,c.beginPath(),c.roundRect(w,E,v,x,4),c.fill(),c.fillStyle=re(e).legendOverflow,c.font="bold 8px JetBrains Mono, monospace",c.textAlign="left",c.textBaseline="top",c.fillText(f,w+l,E+l);for(let b=0;b<a.length;b++){let[R,F]=a[b],H=E+l+M+b*h+h/2;c.fillStyle=F,c.beginPath(),c.arc(w+l+p,H,p,0,Math.PI*2),c.fill(),c.fillStyle=re(e).legendText,c.textAlign="left",c.textBaseline="middle";let L=R.length>14?R.slice(0,13)+"\u2026":R;c.fillText(L,w+l+p*2+6,H)}if(u>0){let b=E+l+M+a.length*h+h/2;c.fillStyle=re(e).legendOverflow,c.textAlign="left",c.textBaseline="middle",c.fillText(`+${u} more`,w+l,b)}}function wn(e){let t=e._resetBtnRect();if(!t)return;let o=e.ctx;o.fillStyle=re(e).resetBg,o.beginPath(),o.roundRect(t.x,t.y,t.w,t.h,4),o.fill(),o.fillStyle=re(e).resetText,o.font="14px JetBrains Mono, monospace",o.textAlign="center",o.textBaseline="middle",o.fillText("\u21BA",t.x+t.w/2,t.y+t.h/2)}function to(e,t,o){let n=e.renderZoom,s=(t-e.pan.x)/n,r=(o-e.pan.y)/n;if(e.currentLevel===ie){let i=Math.min(e.W,e.H)*n/256,u=(Math.max(8,Math.min(10,i*.42))+4)/n,c=u*u,d=5,p=se[d],h=e._layoutScale;if(h&&e.nodes.length>500){let l=(s-e._layoutOffX)/h+e._layoutMinX,m=(r-e._layoutOffY)/h+e._layoutMinY,g=Math.max(0,Math.min(oe-1,Math.floor((l+1)/2*oe))),f=Math.max(0,Math.min(oe-1,Math.floor((m+1)/2*oe))),_=Te-p,M=g>>_,S=f>>_,v=1<<p,x=e.getLevel(d);if(!x._snByBid){x._snByBid=new Map;for(let y of x.supernodes)x._snByBid.set(y.bid,y)}for(let y=-1;y<=1;y++){let A=S+y;if(!(A<0||A>=v))for(let w=-1;w<=1;w++){let E=M+w;if(E<0||E>=v)continue;let b=E<<p|A,R=x._snByBid.get(b);if(R)for(let F of R.members){let H=F.x-s,L=F.y-r;if(H*H+L*L<c)return{type:"node",item:F}}}}}else for(let l=0;l<e.nodes.length;l++){let m=e.nodes[l],g=m.x-s,f=m.y-r;if(g*g+f*f<c)return{type:"node",item:m}}}else{let i=se[e.currentLevel],a=1<<i,u=Math.min(e.W,e.H)*n/a,d=(Math.max(6,Math.min(22,u*.42))+6)/n,p=d*d,h=e.getLevel(e.currentLevel),l=e._layoutScale;if(l&&h.supernodes.length>100){if(!h._snByBid){h._snByBid=new Map;for(let x of h.supernodes)h._snByBid.set(x.bid,x)}let m=(s-e._layoutOffX)/l+e._layoutMinX,g=(r-e._layoutOffY)/l+e._layoutMinY,f=Math.max(0,Math.min(oe-1,Math.floor((m+1)/2*oe))),_=Math.max(0,Math.min(oe-1,Math.floor((g+1)/2*oe))),M=Te-i,S=f>>M,v=_>>M;for(let x=-1;x<=1;x++){let y=v+x;if(!(y<0||y>=a))for(let A=-1;A<=1;A++){let w=S+A;if(w<0||w>=a)continue;let E=h._snByBid.get(w<<i|y);if(!E)continue;let b=E.x-s,R=E.y-r;if(b*b+R*R<p)return{type:"supernode",item:E}}}}else for(let m=0;m<h.supernodes.length;m++){let g=h.supernodes[m],f=g.x-s,_=g.y-r;if(f*f+_*_<p)return{type:"supernode",item:g}}}return null}function Sn(e){let t=[],o=[],n=new Set,s=new Map,r=!1,i=0,a=e.length;for(;i<a;){let u=e.indexOf(`
`,i);u===-1&&(u=a);let c=i;for(;c<u&&(e.charCodeAt(c)===32||e.charCodeAt(c)===9||e.charCodeAt(c)===13);)c++;if(i=u+1,c>=u||e.charCodeAt(c)===35)continue;let d=e.indexOf("	",c);if(d<0||d>=u)continue;let p=e.slice(c,d),h=e.indexOf("	",d+1),l=u;l>0&&e.charCodeAt(l-1)===13&&l--;let m=h>=0&&h<u?e.slice(d+1,h):e.slice(d+1,l);if(n.add(p),n.add(m),t.push(p),o.push(m),h>=0&&h<u){let g=e.slice(h+1,l);g&&(r=!0,s.has(p)||s.set(p,new Set),s.has(m)||s.set(m,new Set),s.get(p).add(g),s.get(m).add(g))}}return{edgeFrom:t,edgeTo:o,edgeCount:t.length,edgeTypeMap:r?s:null,nodeIds:n}}function Ln(e){let t=new Map,o=[],n=e.split(`
`),s=0;if(n.length>0&&n[0].trim().startsWith("#")){let r=n[0].trim().replace(/^#\s*/,"").split("	");for(let i=3;i<r.length;i++)o.push(r[i].trim().toLowerCase().replace(/\s+/g,"_"));s=1}for(let r=s;r<n.length;r++){let i=n[r].replace(/[\r\n]+$/,"");if(!i||i[0]==="#")continue;let a=i.split("	");if(a.length<2)continue;let u={label:a[1]||a[0],group:a.length>=3?a[2]:"unknown",extraProps:{}};for(let c=3;c<a.length;c++){let d=c-3<o.length?o[c-3]:`prop${c+1}`;u.extraProps[d]=a[c]}t.set(a[0],u)}if(o.length===0)for(let r of t.values()){for(let i of Object.keys(r.extraProps))o.includes(i)||o.push(i);break}return{nodes:t,extraPropNames:o}}function En(e,t,o){let n=[],s={};for(let l of e.nodeIds){let m=t?t.get(l):null,g=m?m.group:"unknown",f=m?m.label:l,_=e.edgeTypeMap?e.edgeTypeMap.has(l)?[...e.edgeTypeMap.get(l)]:[]:null,M=m?m.extraProps||{}:{},S={id:l,group:g,label:f,degree:0,edgeTypes:_,extraProps:M};s[l]=S,n.push(S)}let r=[],i={};for(let l=0;l<n.length;l++)i[n[l].id]=[];for(let l=0;l<e.edgeCount;l++){let m=e.edgeFrom[l],g=e.edgeTo[l];s[m]&&s[g]&&(r.push({src:m,dst:g}),s[m].degree++,s[g].degree++,i[m].push(g),i[g].push(m))}let a=["group","label","structure","neighbors"];for(let l of o)a.push(l);let u=!!e.edgeTypeMap;u&&a.push("edgetype");let c=new Array(n.length);for(let l=0;l<n.length;l++){let m=i[n[l].id],g=new Array(m.length);for(let f=0;f<m.length;f++)g[f]=s[m[f]].group;c[l]=g}let d=new Set;for(let l=0;l<n.length;l++)d.add(n[l].group);let p=[...d].sort(),h={};for(let l of o){let m=0,g=0,f=1/0,_=-1/0;for(let M=0;M<n.length;M++){let S=n[M].extraProps[l];if(!S||S==="unknown")continue;g++;let v=Number(S);isFinite(v)&&(m++,v<f&&(f=v),v>_&&(_=v))}g>0&&m/g>=.8&&_>f&&(h[l]={min:f,max:_,coarse:5,medium:50,fine:500})}return{nodeArray:n,nodeIndex:s,edges:r,adjList:i,adjGroups:c,groupNames:a,uniqueGroups:p,hasEdgeTypes:u,numericBins:h}}function oo(e){return e===0?"0":e===1?"1":e<=3?"2-3":e<=7?"4-7":e<=15?"8-15":e<=31?"16-31":"32+"}function no(e,t,o,n){let s=e.toLowerCase(),r=-1,i=0;for(let a=0;a<=s.length;a++){let u=a<s.length?s.charCodeAt(a):0;u>=48&&u<=57||u>=97&&u<=122?r<0&&(r=a):(r>=0&&a-r>1&&(o[n+i]="label:"+s.slice(r,a),i++),r=-1)}return i===0&&(o[n]="label:"+t,i=1),n+i}function so(e,t,o,n,s){if(!t||t==="")return s;let r=Number(t);if(!isFinite(r)||!o)return n[s]=e+":"+t,s+1;let i=o.max-o.min,a=[{prefix:"c",count:o.coarse},{prefix:"m",count:o.medium},{prefix:"f",count:o.fine}];for(let u of a){let c=i/u.count,d=Math.min(u.count-1,Math.floor((r-o.min)/c)),p=o.min+d*c,h=p+c;n[s++]=e+":"+u.prefix+":"+p.toPrecision(3)+"-"+h.toPrecision(3)}return s}function St(e,t,o,n,s,r){r=r||{};let i={};for(let h=0;h<o.length;h++)i[o[h]]=Fe(2001+h,ee);let a=e.length,u=o.length,c=new Float64Array(a*u*2),d={};for(let h=0;h<u;h++)d[o[h]]=h;let p=new Array(200);for(let h=0;h<a;h++){let l=e[h],m=h*u*2;p[0]="group:"+l.group,ge(p,1),me(ne,i.group,c,m+d.group*2);let g=no(l.label,l.id,p,0);ge(p,g),me(ne,i.label,c,m+d.label*2),p[0]="deg:"+oo(l.degree),p[1]="leaf:"+(l.degree===0),ge(p,2),me(ne,i.structure,c,m+d.structure*2);let f=t[h],_=0;if(f.length>0)for(let M=0;M<f.length;M++)p[_++]="ngroup:"+f[M];else p[0]="ngroup:isolated",_=1;if(ge(p,_),me(ne,i.neighbors,c,m+d.neighbors*2),n){if(_=0,l.edgeTypes&&l.edgeTypes.length>0)for(let M=0;M<l.edgeTypes.length;M++)p[_++]="etype:"+l.edgeTypes[M];else p[0]="etype:none",_=1;ge(p,_),me(ne,i.edgetype,c,m+d.edgetype*2)}for(let M=0;M<s.length;M++){let S=s[M],v=l.extraProps&&l.extraProps[S],x=so(S,v,r[S],p,0);x>0&&(ge(p,x),me(ne,i[S],c,m+d[S]*2))}}return{projBuf:c,groupNames:o}}function ro(e,t){let o=Sn(e),n=t?Ln(t):null,s=n?n.nodes:null,r=n?n.extraPropNames:[],i=En(o,s,r),{projBuf:a}=St(i.nodeArray,i.adjGroups,i.groupNames,i.hasEdgeTypes,r,i.numericBins);return{...i,projBuf:a,extraPropNames:r}}var te=null,bn=null,Bn=`
// Constants
const K: u32 = 128u;
const P: u32 = 2147483647u; // 2^31 - 1 (Mersenne prime)
const OPH_THRESHOLD: u32 = 12u;

// Bindings
@group(0) @binding(0) var<storage, read> tokens: array<u32>;       // flat: all hashed tokens
@group(0) @binding(1) var<storage, read> taskMeta: array<u32>;     // per-task: [offset, count, groupIdx] packed as 3 \xD7 u32
@group(0) @binding(2) var<storage, read> hashParams: array<i32>;   // [A[0..127], B[0..127]] concatenated (256 i32)
@group(0) @binding(3) var<storage, read> projMatrix: array<f32>;   // G groups \xD7 2 \xD7 K floats
@group(0) @binding(4) var<storage, read_write> output: array<f32>; // per-task: 2 floats (px, py)

// Mersenne fast-mod: x mod (2^31 - 1). Input x < 2^32.
fn mersMod(x: u32) -> u32 {
  var r = (x & P) + (x >> 31u);
  if (r >= P) { r -= P; }
  return r;
}

// Multiply-mod: (a * b) mod P, where a,b < P (< 2^31).
// Replicates the CPU's hashSlot strategy: split b into 16-bit halves,
// compute a*bHi and a*bLo separately, then combine with mersMod.
// a*bHi: a < 2^31, bHi < 2^16 \u2192 product < 2^47. Exceeds u32.
// Split a into halves too: a = aHi*2^16 + aLo.
// a*bHi = (aHi*bHi)*2^16 + aLo*bHi \u2014 each partial < 2^32.
// Then mersMod the reassembled value.
// (a * b) mod P where a, b < 2^32. Every addition is reduced individually
// to prevent u32 overflow. mersMod inputs must be < 2^32.
fn mulMod(a: u32, b: u32) -> u32 {
  let bHi = b >> 16u;
  let bLo = b & 0xFFFFu;
  let aHi = a >> 16u;
  let aLo = a & 0xFFFFu;

  // Step 1: hi = (a * bHi) mod P
  // = (aHi*bHi*2^16 + aLo*bHi) mod P
  let p1 = aHi * bHi;                       // < 2^32
  var hi = mersMod(p1 << 16u);              // low 32 bits of p1*2^16
  hi = mersMod(hi + (p1 >> 16u) * 2u);     // carry: p1>>16 * 2^32 \u2261 p1>>16 * 2
  let p2 = aLo * bHi;                       // < 2^32
  hi = mersMod(hi + mersMod(p2));           // reduce p2 first since hi+p2 can overflow

  // Step 2: (hi * 2^16 + a * bLo) mod P
  let hiLo = hi & 0xFFFFu;
  let hiHi = hi >> 16u;
  var r = mersMod(hiLo << 16u);             // low part of hi * 2^16
  r = mersMod(r + hiHi * 2u);              // carry of hi * 2^16

  let q1 = aHi * bLo;                       // < 2^32
  r = mersMod(r + mersMod(q1 << 16u));     // low part of aHi*bLo*2^16
  r = mersMod(r + (q1 >> 16u) * 2u);       // carry of aHi*bLo*2^16

  let q2 = aLo * bLo;                       // < 2^32
  r = mersMod(r + mersMod(q2));             // reduce q2 first

  return r;
}

fn hashSlot(a: i32, tv: u32, b: i32) -> u32 {
  let au = u32(a);
  let bu = u32(b);
  let product = mulMod(au, tv);
  var result = product + bu;
  // result can exceed P; need mersMod
  result = mersMod(result);
  return result;
}

fn getParamA(i: u32) -> i32 { return hashParams[i]; }
fn getParamB(i: u32) -> i32 { return hashParams[K + i]; }

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) gid: vec3u) {
  let taskId = gid.x;
  let numTasks = arrayLength(&taskMeta) / 3u;
  if (taskId >= numTasks) { return; }

  let off = taskMeta[taskId * 3u];
  let tc = taskMeta[taskId * 3u + 1u];
  let groupIdx = taskMeta[taskId * 3u + 2u];
  let outOff = taskId * 2u;

  // Empty token set \u2192 neutral [0, 0]
  if (tc == 0u) {
    output[outOff] = 0.0;
    output[outOff + 1u] = 0.0;
    return;
  }

  // Compute MinHash signature in local array
  var sig: array<f32, 128>;

  if (tc < OPH_THRESHOLD) {
    // Standard MinHash: k hash evaluations per token
    for (var i = 0u; i < K; i++) { sig[i] = f32(P); }
    for (var t = 0u; t < tc; t++) {
      let tv = tokens[off + t];
      for (var j = 0u; j < K; j++) {
        let hv = hashSlot(getParamA(j), tv, getParamB(j));
        if (f32(hv) < sig[j]) { sig[j] = f32(hv); }
      }
    }
  } else {
    // OPH: single hash per token, densify empty bins
    var occupied: array<u32, 4>; // 128 bits as 4 \xD7 u32
    for (var i = 0u; i < 4u; i++) { occupied[i] = 0u; }
    for (var i = 0u; i < K; i++) { sig[i] = f32(P); }

    for (var t = 0u; t < tc; t++) {
      let tv = tokens[off + t];
      let hv = hashSlot(getParamA(0u), tv, getParamB(0u));
      let bin = hv % K;
      let val = hv / K;
      if (f32(val) < sig[bin]) {
        sig[bin] = f32(val);
        occupied[bin >> 5u] |= (1u << (bin & 31u));
      }
    }

    // Densify empty bins (Knuth multiplicative hash for donor search)
    for (var i = 0u; i < K; i++) {
      if ((occupied[i >> 5u] & (1u << (i & 31u))) != 0u) { continue; }
      var donor = (i * 2654435761u) % K;
      var attempts = 0u;
      loop {
        if (attempts >= K) { break; }
        if ((occupied[donor >> 5u] & (1u << (donor & 31u))) != 0u) { break; }
        donor = (donor * 2654435761u + 1u) % K;
        attempts++;
      }
      if ((occupied[donor >> 5u] & (1u << (donor & 31u))) != 0u) {
        sig[i] = sig[donor];
      }
    }
  }

  // Z-score normalize
  var mean: f32 = 0.0;
  for (var i = 0u; i < K; i++) { mean += sig[i]; }
  mean /= f32(K);
  var variance: f32 = 0.0;
  for (var i = 0u; i < K; i++) {
    let d = sig[i] - mean;
    variance += d * d;
  }
  var sd = sqrt(variance / f32(K));
  // When variance is near-zero (uniform signature), output neutral [0,0].
  // Matches CPU behavior: std=0 \u2192 fallback std=1 \u2192 all (sig-mean)/1 = 0 \u2192 projection = 0.
  // Degenerate signature (all/nearly all same value): variance accumulates float32
  // rounding errors. CPU gets exact 0 variance \u2192 [0,0]. Match that behavior.
  if (sd < mean * 1e-5 || sd < 1.0) {
    output[outOff] = 0.0;
    output[outOff + 1u] = 0.0;
    return;
  }

  // Project to 2D using the group's projection matrix
  let projOff = groupIdx * 2u * K;
  var px: f32 = 0.0;
  var py: f32 = 0.0;
  for (var i = 0u; i < K; i++) {
    let v = (sig[i] - mean) / sd;
    px += v * projMatrix[projOff + i];
    py += v * projMatrix[projOff + K + i];
  }

  output[outOff] = px;
  output[outOff + 1u] = py;
}
`;async function Lt(){if(te)return!0;if(!navigator.gpu)return console.log("[GPU] navigator.gpu not available"),!1;let e=await navigator.gpu.requestAdapter();if(!e)return console.log("[GPU] No GPU adapter found"),!1;try{let s=e.info||{};console.log("[GPU] Adapter:",s.vendor||"unknown",s.architecture||"",s.device||"")}catch{}te=await e.requestDevice(),console.log("[GPU] Device acquired, maxStorageBuffersPerShaderStage:",te.limits.maxStorageBuffersPerShaderStage),te.pushErrorScope("validation");let t=te.createShaderModule({code:Bn}),o=await t.getCompilationInfo();for(let s of o.messages)s.type==="error"&&console.error("WGSL error:",s.message,"line:",s.lineNum);bn=te.createComputePipeline({layout:"auto",compute:{module:t,entryPoint:"main"}});let n=await te.popErrorScope();return n?(console.error("Pipeline creation error:",n.message),!1):!0}var Pn=`
@group(0) @binding(0) var<storage, read> propPx: array<f32>;      // property anchors X
@group(0) @binding(1) var<storage, read> propPy: array<f32>;      // property anchors Y
@group(0) @binding(2) var<storage, read> adjOffsets: array<u32>;  // CSR offsets [N+1]
@group(0) @binding(3) var<storage, read> adjTargets: array<u32>;  // CSR neighbor indices
@group(0) @binding(4) var<storage, read> posIn: array<f32>;       // read positions from previous pass
@group(0) @binding(5) var<storage, read_write> posOut: array<f32>; // write new positions

struct Params {
  alpha: f32,
  N: u32,
}
@group(0) @binding(6) var<uniform> params: Params;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) gid: vec3u) {
  let i = gid.x;
  if (i >= params.N) { return; }

  let alpha = params.alpha;
  let propX = propPx[i];
  let propY = propPy[i];

  let adjStart = adjOffsets[i];
  let adjEnd = adjOffsets[i + 1u];
  let degree = adjEnd - adjStart;

  if (degree == 0u) {
    posOut[i * 2u] = propX;
    posOut[i * 2u + 1u] = propY;
    return;
  }

  var nx: f32 = 0.0;
  var ny: f32 = 0.0;
  for (var e = adjStart; e < adjEnd; e++) {
    let j = adjTargets[e];
    nx += posIn[j * 2u];
    ny += posIn[j * 2u + 1u];
  }
  nx /= f32(degree);
  ny /= f32(degree);

  posOut[i * 2u] = (1.0 - alpha) * propX + alpha * nx;
  posOut[i * 2u + 1u] = (1.0 - alpha) * propY + alpha * ny;
}
`,We=null;async function Rn(){if(We)return;if(!te)throw new Error("GPU not initialized");te.pushErrorScope("validation");let e=te.createShaderModule({code:Pn}),t=await e.getCompilationInfo();for(let n of t.messages)n.type==="error"&&console.error("[GPU] Blend WGSL error:",n.message,"line:",n.lineNum);We=te.createComputePipeline({layout:"auto",compute:{module:e,entryPoint:"main"}});let o=await te.popErrorScope();o?console.error("[GPU] Blend pipeline error:",o.message):console.log("[GPU] Blend pipeline ready")}async function Cn(e,t,o,n,s,r,i){await Rn();let a=e.length,u=Math.max(0,Math.min(1,n)),c=0;for(let P of t){let $=o[P]||0;$>c&&(c=$)}let d=Math.max(c*rt,it),p=0,h={};for(let P of t)h[P]=Math.max(o[P]||0,d),p+=h[P];let l=new Float32Array(a),m=new Float32Array(a);for(let P=0;P<a;P++){let $=e[P],Q=0,k=0;for(let O of t){let U=$.projections[O];U&&(Q+=U[0]*h[O],k+=U[1]*h[O])}l[P]=Q/p,m[P]=k/p}let g={};for(let P=0;P<a;P++)g[e[P].id]=P;let f=new Uint32Array(a+1),_=0;for(let P=0;P<a;P++){f[P]=_;let $=s[e[P].id];if($)for(let Q of $)g[Q]!==void 0&&_++}f[a]=_;let M=new Uint32Array(_),S=0;for(let P=0;P<a;P++){let $=s[e[P].id];if($)for(let Q of $){let k=g[Q];k!==void 0&&(M[S++]=k)}}if(u===0||i===0)return{px:l,py:m};let v=(P,$)=>{let Q=Math.max(256,P.byteLength),k=te.createBuffer({size:Q,usage:$,mappedAtCreation:!0});return new Uint8Array(k.getMappedRange()).set(new Uint8Array(P.buffer,P.byteOffset,P.byteLength)),k.unmap(),k},x=GPUBufferUsage.STORAGE,y=GPUBufferUsage.UNIFORM,A=v(l,x),w=v(m,x),E=v(f,x),b=v(M.length>0?M:new Uint32Array(1),x),R=Math.max(256,a*2*4),F=new Float32Array(a*2);for(let P=0;P<a;P++)F[P*2]=l[P],F[P*2+1]=m[P];let H=v(F,x|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST),L=te.createBuffer({size:R,usage:x|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),B=new ArrayBuffer(16);new Float32Array(B,0,1)[0]=u,new Uint32Array(B,4,1)[0]=a;let I=te.createBuffer({size:16,usage:y,mappedAtCreation:!0});new Uint8Array(I.getMappedRange()).set(new Uint8Array(B)),I.unmap();let C=te.createBindGroup({layout:We.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:A}},{binding:1,resource:{buffer:w}},{binding:2,resource:{buffer:E}},{binding:3,resource:{buffer:b}},{binding:4,resource:{buffer:H}},{binding:5,resource:{buffer:L}},{binding:6,resource:{buffer:I}}]}),j=te.createBindGroup({layout:We.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:A}},{binding:1,resource:{buffer:w}},{binding:2,resource:{buffer:E}},{binding:3,resource:{buffer:b}},{binding:4,resource:{buffer:L}},{binding:5,resource:{buffer:H}},{binding:6,resource:{buffer:I}}]}),D=Math.ceil(a/64);for(let P=0;P<i;P++){let $=P%2===0?C:j,Q=te.createCommandEncoder(),k=Q.beginComputePass();k.setPipeline(We),k.setBindGroup(0,$),k.dispatchWorkgroups(D),k.end(),te.queue.submit([Q.finish()])}let Z=i%2===0?H:L,N=i%2===1?L:H,G=Math.max(256,a*2*4),W=te.createBuffer({size:G,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),T=te.createCommandEncoder();T.copyBufferToBuffer(N,0,W,0,a*2*4),te.queue.submit([T.finish()]),await W.mapAsync(GPUMapMode.READ);let V=new Float32Array(W.getMappedRange()).slice(0,a*2);W.unmap(),A.destroy(),w.destroy(),E.destroy(),b.destroy(),H.destroy(),L.destroy(),I.destroy(),W.destroy();let X=new Float32Array(a),K=new Float32Array(a);for(let P=0;P<a;P++)X[P]=V[P*2],K[P]=V[P*2+1];return{px:X,py:K}}async function io(e,t,o,n,s,r,i,a,u){let c=await Cn(e,t,o,n,s,r,i);for(let d=0;d<e.length;d++)e[d].px=c.px[d],e[d].py=c.py[d];a==="gaussian"?He(e,u||{}):Ie(e)}var ze=class{constructor(t,o={}){this.canvas=t,this.ctx=t.getContext("2d"),this.nodes=o.nodes||[],this.edges=o.edges||[],this.nodeIndexFull=o.nodeIndexFull||{},this.adjList=o.adjList||{},this.groupNames=o.groupNames||[],this.propWeights={...o.propWeights},this.propColors=o.propColors||{},this.groupColors=o.groupColors||this.propColors.group||{},this.groupProjections={},this.smoothAlpha=o.smoothAlpha||0,this.maxDegree=1,this.hasEdgeTypes=o.hasEdgeTypes||!1;for(let n=0;n<this.groupNames.length;n++)this.groupProjections[this.groupNames[n]]=Fe(2001+n,ee);for(let n of this.nodes)n.degree>this.maxDegree&&(this.maxDegree=n.degree);this.W=0,this.H=0,this.currentLevel=o.initialLevel??3,this.baseLevel=this.currentLevel,this.pan={x:0,y:0},this.zoom=1,this.sizeBy=o.sizeBy||"edges",this.sizeLog=o.sizeLog||!1,this.edgeMode=o.edgeMode||"curves",this.heatmapMode=o.heatmapMode||"off",this.quantMode=o.quantMode||"gaussian",this.showLegend=o.showLegend?1:0,this.showResetBtn=o.showResetBtn||!1,this._progressText=null,this.showFps=o.showFps||!1,this._colorScheme=o.colorScheme||0,this._colorBy=o.colorBy||null,this._lightMode=o.lightMode||!1,this._useGPU=!1,this._gl=null,this._glCanvas=null,this._glWrapper=null,this._quantStats={},this._blendGen=0,o.webgl&&this._initWebGL(t),this.labelProps=new Set(o.labelProps||[]),this._initLevel=this.currentLevel,this._initColorScheme=this._colorScheme,this.selectedIds=new Set,this._primarySelectedId=null,this.hoveredId=null,this._onSelect=o.onSelect||null,this._onHover=o.onHover||null,this.levels=new Array(se.length).fill(null),this._cachedDominant="label",this._cachedLabelProps=["label"],this._cachedColorMap={},this._refreshPropCache(),this.mouseDown=!1,this.mouseMoved=!1,this.mouseStart=null,this.t1=null,this.t2=null,this.touchMoved=!1,this._renderPending=!1,this._edgeBuildRaf=null,this._abortController=new AbortController,this._resizeObserver=null,this._onRender=o.onRender||null,o.skipEvents||this._bindEvents(),this.resize()}get renderZoom(){return Math.max(1,this.zoom*Math.pow(2,this.currentLevel-this.baseLevel))}get selectedId(){return this._primarySelectedId}set selectedId(t){this._primarySelectedId=t,t===null?this.selectedIds.clear():this.selectedIds.has(t)||(this.selectedIds.clear(),this.selectedIds.add(t))}isSelected(t){return this.selectedIds.has(t)}toggleSelection(t){this.selectedIds.has(t)?(this.selectedIds.delete(t),this._primarySelectedId=this.selectedIds.size>0?[...this.selectedIds].pop():null):(this.selectedIds.add(t),this._primarySelectedId=t)}get _dominantProp(){return this._cachedDominant}get _labelProp(){return this._cachedLabelProps[0]}_refreshPropCache(){let t="label",o=0;for(let s of this.groupNames)(this.propWeights[s]||0)>o&&(o=this.propWeights[s],t=s);let n=this._colorBy&&this.groupNames.includes(this._colorBy)?this._colorBy:t;this._cachedDominant=n,this._cachedLabelProps=this.labelProps.size>0?[...this.labelProps]:[t],this._cachedColorMap=this.propColors[n]||{},this.levels=new Array(se.length).fill(null),this._edgeBuildRaf&&(cancelAnimationFrame(this._edgeBuildRaf),this._edgeBuildRaf=null)}cycleColorScheme(){this._colorScheme=(this._colorScheme+1)%Oe.length;for(let t of this.groupNames){let o=[...new Set(this.nodes.map(n=>ue(n,t,this.adjList)))].sort();this.propColors[t]=Ge(o,this._colorScheme)}this._refreshPropCache(),this.layoutAll(),this.render()}get colorScheme(){return this._colorScheme}set colorScheme(t){this._colorScheme=t%Oe.length;for(let o of this.groupNames){let n=[...new Set(this.nodes.map(s=>ue(s,o,this.adjList)))].sort();this.propColors[o]=Ge(n,this._colorScheme)}this._refreshPropCache(),this.layoutAll(),this.render()}get colorSchemeName(){return lt[this._colorScheme]}get colorBy(){return this._colorBy}set colorBy(t){this._colorBy=t&&this.groupNames.includes(t)?t:null,this._refreshPropCache(),this.layoutAll(),this.render()}get lightMode(){return this._lightMode}set lightMode(t){if(this._lightMode=!!t,this._gl&&this.canvas){let o=this.canvas.ownerDocument?.documentElement;if(o){let n=getComputedStyle(o).getPropertyValue("--canvas-bg").trim(),s=n&&n.match(/#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);s&&(this._gl._clearR=parseInt(s[1],16)/255,this._gl._clearG=parseInt(s[2],16)/255,this._gl._clearB=parseInt(s[3],16)/255)}}this.render()}_nodeLabel(t){let o=this._cachedLabelProps;if(o.length===1)return ue(t,o[0],this.adjList);let n=[];for(let s of o){let r=ue(t,s,this.adjList);r&&r!=="unknown"&&r!==t.id&&n.push(r)}return n.length>0?n.join(" \xB7 "):t.label||t.id}_supernodeLabel(t){let o=this._cachedLabelProps;if(o.length===1)return at(t,o[0],this.adjList);let n=[];for(let s of o){let r=at(t,s,this.adjList);r&&r!=="unknown"&&n.push(r)}return n.length>0?n.join(" \xB7 "):t.repName}_nodeColorVal(t){return ue(t,this._cachedDominant,this.adjList)}_nodeColor(t){return this._cachedColorMap[this._nodeColorVal(t)]||"#888888"}_supernodeColor(t){let o={};for(let n of t.members){let s=this._nodeColorVal(n);o[s]=(o[s]||0)+1}return this._cachedColorMap[Me(o)]||"#888888"}getLevel(t){if(this.levels[t])!this.levels[t]._edgesReady&&!this._edgeBuildRaf&&this._scheduleEdgeBuild(t);else{let o=this._dominantProp,n=this.propColors[o];this.levels[t]=Ot(se[t],this.nodes,s=>ue(s,o,this.adjList),s=>this._nodeLabel(s),s=>n&&n[s]||"#888888"),this.layoutAll(),this._scheduleEdgeBuild(t)}return this.levels[t]}_scheduleEdgeBuild(t){this._edgeBuildRaf&&(cancelAnimationFrame(this._edgeBuildRaf),this._edgeBuildRaf=null);let o=this.levels[t];if(!o||o._edgesReady)return;let n=this.edges,s=this.nodeIndexFull,r=se[t],i=5e4,a=r<=13,u=67108864,c=new Map,d=0,p=()=>{let h=Math.min(d+i,n.length);for(let l=d;l<h;l++){let m=n[l],g=s[m.src],f=s[m.dst];if(!g||!f)continue;let _=$e(g.gx,g.gy,r),M=$e(f.gx,f.gy,r);if(_!==M){let S=_<M?_:M,v=_<M?M:_,x=a?S*u+v:S+","+v;c.set(x,(c.get(x)||0)+1)}}if(d=h,this.levels[t]!==o){this._edgeBuildRaf=null;return}if(d<n.length)this._edgeBuildRaf=requestAnimationFrame(p);else{let l=new Array(c.size),m=0;if(a)for(let[g,f]of c)l[m++]={a:g/u|0,b:g%u,weight:f};else for(let[g,f]of c){let _=g.indexOf(",");l[m++]={a:parseInt(g.slice(0,_),10),b:parseInt(g.slice(_+1),10),weight:f}}o.snEdges=l,o._edgesReady=!0,this._edgeBuildRaf=null,this.render()}};this._edgeBuildRaf=requestAnimationFrame(p)}layoutAll(){eo(this)}render(){this._renderPending||(this._renderPending=!0,requestAnimationFrame(()=>{this._renderPending=!1;let t=performance.now();this._gl&&Nt(this._gl,this),Je(this),this._lastFrameMs=performance.now()-t,this._frameCount=(this._frameCount||0)+1;let o=performance.now();this._fpsTime||(this._fpsTime=o),o-this._fpsTime>=1e3&&(this._fps=this._frameCount,this._frameCount=0,this._fpsTime=o),this.showFps&&this._drawFps(),this._postRender()}))}_drawFps(){let t=this.ctx,o=this._fps||0,n=this._lastFrameMs||0,s=this._gl?"GL":"2D",r=`${o} fps \xB7 ${n.toFixed(1)}ms \xB7 ${s}`;t.font="10px JetBrains Mono",t.fillStyle=this._lightMode?"rgba(60,60,80,0.6)":"rgba(200,200,220,0.6)",t.textAlign="left",t.textBaseline="top",t.fillText(r,6,6)}_postRender(){this._onRender&&this._onRender()}showProgress(t){if(this._progressText=t,Je(this),t){let o=this.canvas.getContext("2d"),n=this.W,s=this.H,r=28,i=s/2-r/2;o.fillStyle="rgba(10, 10, 15, 0.8)",o.fillRect(0,i,n,r),o.fillStyle="#c8c8d8",o.font="13px Inter, sans-serif",o.textAlign="center",o.textBaseline="middle",o.fillText(t,n/2,s/2)}}renderNow(){Je(this)}worldToScreen(t,o){return Jt(this,t,o)}screenToWorld(t,o){return zt(this,t,o)}hitTest(t,o){return to(this,t,o)}resize(){this.W=this.canvas.clientWidth||300,this.H=this.canvas.clientHeight||300,this.canvas.width=this.W,this.canvas.height=this.H,this._glCanvas&&(this._glCanvas.width=this.W,this._glCanvas.height=this.H),this.layoutAll(),this.render()}zoomForLevel(t){this.zoom=1,this.pan={x:0,y:0}}switchLevel(t){let o=this.renderZoom;this.currentLevel=t,this.zoom=o/Math.pow(2,t-this.baseLevel),this.selectedId=null,this.layoutAll(),this.render()}_checkAutoLevel(){let t=this.currentLevel,o=st.length-1;if(t<o&&this.zoom>=2){this.zoom/=2,this.currentLevel=t+1,this.layoutAll();return}if(t>0&&this.zoom<.5){this.zoom*=2,this.currentLevel=t-1,this.layoutAll(),this.renderZoom<=1&&(this.pan={x:0,y:0});return}this.currentLevel===0&&this.renderZoom<=1&&(this.pan={x:0,y:0})}get useGPU(){return this._useGPU}set useGPU(t){this._useGPU=!!t}get useWebGL(){return!!this._gl}set useWebGL(t){t&&!this._gl?this._initWebGL(this.canvas):!t&&this._gl&&this._destroyWebGL(),this.resize(),this.render()}_initWebGL(t){let o=t.parentElement;if(!o)return;let n=document.createElement("div"),s=getComputedStyle(t);n.style.cssText=`position:relative;width:${s.width};height:${s.height};min-height:0;overflow:hidden;grid-column:${s.gridColumn};grid-row:${s.gridRow}`,o.insertBefore(n,t),n.appendChild(t),this._glWrapper=n,this._glCanvas=document.createElement("canvas"),this._glCanvas.style.cssText="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none";let r=getComputedStyle(t).backgroundColor;if(r&&r!=="rgba(0, 0, 0, 0)"&&(this._glCanvas.style.background=r,this._origCanvasBg=t.style.background),t.style.position="absolute",t.style.top="0",t.style.left="0",t.style.width="100%",t.style.height="100%",t.style.background="transparent",n.insertBefore(this._glCanvas,t),this._gl=Ut(this._glCanvas),!this._gl){n.parentElement.insertBefore(t,n),n.remove(),t.style.position="",t.style.top="",t.style.left="",t.style.width="",t.style.height="",this._origCanvasBg!==void 0?(t.style.background=this._origCanvasBg,this._origCanvasBg=void 0):t.style.background="",this._glCanvas=null,this._glWrapper=null;return}if(r){let i=r.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);i&&(this._gl._clearR=+i[1]/255,this._gl._clearG=+i[2]/255,this._gl._clearB=+i[3]/255)}console.log("[GL] WebGL2 rendering enabled")}_destroyWebGL(){if(this._glCanvas&&(this._glCanvas.remove(),this._glCanvas=null,this._gl=null),this._glWrapper){let t=this._glWrapper.parentElement;t&&(t.insertBefore(this.canvas,this._glWrapper),this._glWrapper.remove()),this._glWrapper=null,this.canvas.style.position="",this.canvas.style.top="",this.canvas.style.left="",this.canvas.style.width="",this.canvas.style.height="",this._origCanvasBg!==void 0&&(this.canvas.style.background=this._origCanvasBg,this._origCanvasBg=void 0),console.log("[GL] WebGL2 rendering disabled")}}async _blend(){if(this._useGPU&&this.nodes.length>5e4)try{await io(this.nodes,this.groupNames,this.propWeights,this.smoothAlpha,this.adjList,this.nodeIndexFull,5,this.quantMode,this._quantStats),this._blendGen++;return}catch(t){console.warn("[GPU] Blend failed, falling back to CPU:",t.message)}ke(this.nodes,this.groupNames,this.propWeights,this.smoothAlpha,this.adjList,this.nodeIndexFull,5,this.quantMode,this._quantStats),this._blendGen++}setWeights(t){Object.assign(this.propWeights,t),this._refreshPropCache(),this._blend().then(()=>{this.layoutAll(),this.render()})}setAlpha(t){this.smoothAlpha=t,this.levels=new Array(se.length).fill(null),this._blend().then(()=>{this.layoutAll(),this.render()})}setOptions(t){t.heatmapMode!==void 0&&(this.heatmapMode=t.heatmapMode),t.edgeMode!==void 0&&(this.edgeMode=t.edgeMode),t.sizeBy!==void 0&&(this.sizeBy=t.sizeBy),t.sizeLog!==void 0&&(this.sizeLog=t.sizeLog),t.labelProps!==void 0&&(this.labelProps=new Set(t.labelProps),this._refreshPropCache()),this.render()}resetView(){this.currentLevel=this._initLevel,this.baseLevel=this._initLevel,this.zoom=1,this.pan={x:0,y:0},this.selectedId=null,this.hoveredId=null,this._colorScheme!==this._initColorScheme&&(this.colorScheme=this._initColorScheme),this.resize()}exportLayout(){let t=["# id	px	py	gx	gy"];for(let o of this.nodes)t.push(`${o.id}	${o.px}	${o.py}	${o.gx}	${o.gy}`);return t.join(`
`)}_resetBtnRect(){if(!this.showResetBtn)return null;let t=24;return{x:this.W-t-8,y:8,w:t,h:t}}_bindEvents(){let t=this.canvas,o={signal:this._abortController.signal};t.addEventListener("mousedown",r=>{this.mouseDown=!0,this.mouseMoved=!1,this.mouseStart={x:r.clientX,y:r.clientY}},o),t.addEventListener("mousemove",r=>{if(!this.mouseDown){let i=t.getBoundingClientRect(),a=r.clientX-i.left,u=r.clientY-i.top,c=this._resetBtnRect();if(c&&a>=c.x&&a<=c.x+c.w&&u>=c.y&&u<=c.y+c.h){t.style.cursor="pointer";return}let d=this.hitTest(a,u),p=d?d.type==="node"?d.item.id:d.item.bid:null;p!==this.hoveredId&&(this.hoveredId=p,t.style.cursor=p?"pointer":"grab",this._onHover&&this._onHover(d),this.render());return}this.pan.x+=r.clientX-this.mouseStart.x,this.pan.y+=r.clientY-this.mouseStart.y,this.mouseStart={x:r.clientX,y:r.clientY},(Math.abs(this.pan.x)>4||Math.abs(this.pan.y)>4)&&(this.mouseMoved=!0),this.render()},o),t.addEventListener("mouseup",r=>{if(this.mouseDown=!1,!this.mouseMoved){let i=t.getBoundingClientRect(),a=r.clientX-i.left,u=r.clientY-i.top,c=this._resetBtnRect();if(c&&a>=c.x&&a<=c.x+c.w&&u>=c.y&&u<=c.y+c.h){this.resetView();return}if(a<40&&u<20){this.showFps=!this.showFps,this.render();return}let d=this.hitTest(a,u),p=r.ctrlKey||r.metaKey||r.shiftKey;if(d){let h=d.type==="node"?d.item.id:d.item.bid;p?this.toggleSelection(h):this.selectedId=h,this._onSelect&&this._onSelect(d)}else p||(this.selectedId=null);this.render()}},o),t.addEventListener("mouseleave",()=>{this.mouseDown=!1},o),t.addEventListener("dblclick",r=>{r.preventDefault();let i=t.getBoundingClientRect(),a=r.clientX-i.left,u=r.clientY-i.top;if(r.shiftKey)this._animateZoom(1/2,a,u);else{let c=this.hitTest(a,u);c?this._zoomToHit(c):this._animateZoom(2,a,u)}},o);let n=r=>{let i=t.getBoundingClientRect();return{id:r.identifier,x:r.clientX-i.left,y:r.clientY-i.top}},s=(r,i)=>Math.sqrt((r.x-i.x)**2+(r.y-i.y)**2);t.addEventListener("touchstart",r=>{r.preventDefault(),this.touchMoved=!1,r.touches.length===1?(this.t1=n(r.touches[0]),this.t2=null):r.touches.length===2&&(this.t1=n(r.touches[0]),this.t2=n(r.touches[1]))},{passive:!1,signal:this._abortController.signal}),t.addEventListener("touchmove",r=>{if(r.preventDefault(),this.touchMoved=!0,r.touches.length===1&&!this.t2){let i=n(r.touches[0]);this.t1&&(this.pan.x+=i.x-this.t1.x,this.pan.y+=i.y-this.t1.y),this.t1=i,this.render()}else if(r.touches.length===2){let i=n(r.touches[0]),a=n(r.touches[1]);if(this.t1&&this.t2){let u=s(i,a)/(s(this.t1,this.t2)||1),c=(i.x+a.x)/2,d=(i.y+a.y)/2,p=this.renderZoom;this.zoom=Math.max(.25,Math.min(1e4,this.zoom*u)),this._checkAutoLevel();let h=this.renderZoom/p;this.pan.x=c-(c-this.pan.x)*h,this.pan.y=d-(d-this.pan.y)*h;let l=(this.t1.x+this.t2.x)/2,m=(this.t1.y+this.t2.y)/2;this.pan.x+=c-l,this.pan.y+=d-m,this.render()}this.t1=i,this.t2=a}},{passive:!1,signal:this._abortController.signal}),t.addEventListener("touchend",r=>{if(r.preventDefault(),r.touches.length===0){if(!this.touchMoved&&this.t1){let i=this.hitTest(this.t1.x,this.t1.y);i?(this.selectedId=i.type==="node"?i.item.id:i.item.bid,this._onSelect&&this._onSelect(i)):this.selectedId=null,this.render()}this.t1=null,this.t2=null}else r.touches.length===1&&(this.t1=n(r.touches[0]),this.t2=null,this.touchMoved=!0)},{passive:!1,signal:this._abortController.signal}),t.addEventListener("touchcancel",()=>{this.t1=null,this.t2=null},o),t.addEventListener("wheel",r=>{r.preventDefault();let i=t.getBoundingClientRect(),a=r.clientX-i.left,u=r.clientY-i.top,c=r.deltaY<0?1.05:1/1.05,d=this.renderZoom;this.zoom=Math.max(.25,Math.min(1e4,this.zoom*c)),this._checkAutoLevel();let p=this.renderZoom/d;this.pan.x=a-(a-this.pan.x)*p,this.pan.y=u-(u-this.pan.y)*p,this.render()},{passive:!1,signal:this._abortController.signal}),t.setAttribute("tabindex","0"),t.addEventListener("keydown",r=>{r.key==="ArrowLeft"&&this.currentLevel>0?(r.preventDefault(),this.switchLevel(this.currentLevel-1)):r.key==="ArrowRight"&&this.currentLevel<st.length-1?(r.preventDefault(),this.switchLevel(this.currentLevel+1)):r.key==="+"||r.key==="="?(r.preventDefault(),this._zoomBy(1.15)):r.key==="-"||r.key==="_"?(r.preventDefault(),this._zoomBy(1/1.15)):r.key==="f"?(this.showFps=!this.showFps,this.render()):r.key==="l"?(this.showLegend=(this.showLegend+1)%5,this.render()):r.key==="c"&&this.cycleColorScheme()},o),typeof ResizeObserver<"u"&&(this._resizeObserver=new ResizeObserver(()=>this.resize()),this._resizeObserver.observe(t))}destroy(){this._abortController.abort(),this._gl&&this._destroyWebGL(),this._resizeObserver&&(this._resizeObserver.disconnect(),this._resizeObserver=null),this._edgeBuildRaf&&(cancelAnimationFrame(this._edgeBuildRaf),this._edgeBuildRaf=null)}_zoomBy(t){let o=this.renderZoom;this.zoom=Math.max(.25,Math.min(1e4,this.zoom*t)),this._checkAutoLevel();let n=this.renderZoom/o;this.pan.x=this.W/2-(this.W/2-this.pan.x)*n,this.pan.y=this.H/2-(this.H/2-this.pan.y)*n,this.render()}_animateZoom(t,o,n){let s={x:this.pan.x,y:this.pan.y},r=this.zoom,i=Math.max(.25,r*t),a=this.renderZoom,c=Math.max(1,i*Math.pow(2,this.currentLevel-this.baseLevel))/a,d={x:o-(o-s.x)*c,y:n-(n-s.y)*c},p=performance.now(),h=l=>{let m=Math.min(1,(l-p)/300),g=1-Math.pow(1-m,3);this.zoom=r+(i-r)*g,this.pan.x=s.x+(d.x-s.x)*g,this.pan.y=s.y+(d.y-s.y)*g,this.renderNow(),m<1?requestAnimationFrame(h):(this._checkAutoLevel(),this.renderNow())};requestAnimationFrame(h)}_zoomToHit(t){let o=t.item,n={x:this.pan.x,y:this.pan.y},s=this.zoom,r=s*2,i=this.worldToScreen(o.x,o.y),a=this.renderZoom,c=Math.max(1,r*Math.pow(2,this.currentLevel-this.baseLevel))/a,d={x:this.W/2-(this.W/2-n.x)*c-(i.x-this.W/2)*c,y:this.H/2-(this.H/2-n.y)*c-(i.y-this.H/2)*c},p=performance.now(),h=l=>{let m=Math.min(1,(l-p)/350),g=1-Math.pow(1-m,3);this.zoom=s+(r-s)*g,this.pan.x=n.x+(d.x-n.x)*g,this.pan.y=n.y+(d.y-n.y)*g,this.renderNow(),m<1?requestAnimationFrame(h):(this._checkAutoLevel(),this.renderNow())};requestAnimationFrame(h)}};function ao(e,t,o,n,s,r,i,a){let u={};for(let g of r)u[g]=g==="group"?3:g==="label"?1:0;Object.assign(u,a.weights||{});let c={},d={};for(let g of r)d[g]=new Set;for(let g of t){if(d.group.add(g.group||"unknown"),d.label.add(g.label||g.id),d.structure.add(`deg:${g.degree}`),d.neighbors.add("_"),g.edgeTypes){let f=Array.isArray(g.edgeTypes)?g.edgeTypes:[...g.edgeTypes];for(let _ of f)d.edgetype&&d.edgetype.add(_)}if(g.extraProps)for(let[f,_]of Object.entries(g.extraProps))d[f]&&d[f].add(_==null?"unknown":String(_))}for(let g of r)c[g]=Ge([...d[g]].sort(),a.colorScheme||0);let p=a.smoothAlpha||0,h=a.quantMode,l=new ze(e,{nodes:t,edges:o,nodeIndexFull:n,adjList:s,groupNames:r,propWeights:u,propColors:c,groupColors:c.group,hasEdgeTypes:i,smoothAlpha:p,quantMode:h,...a}),m=a.useGPU||a.autoGPU!==!1&&t.length*r.length>2e3;return(async()=>{if(m&&await Lt().catch(()=>!1)&&(l.useGPU=!0,console.log(`[GPU] GPU enabled (${t.length} nodes, ${r.length} groups)`)),a.autoTune){l.showProgress("Auto-tuning...");let g={...a.autoTune};g.onProgress=_=>{let M=Math.round(100*_.step/Math.max(1,_.total)),S=_.phase==="presets"?"scanning presets":_.phase==="done"?"done":"refining";l.showProgress(`Auto-tuning: ${S} (${M}%)`)};let f=await ut(l.nodes,l.groupNames,l.adjList,l.nodeIndexFull,g);if(g.weights!==!1&&!a.weights)for(let _ of l.groupNames)l.propWeights[_]=f.weights[_]??0;g.alpha!==!1&&a.smoothAlpha==null&&(l.smoothAlpha=f.alpha),g.quant!==!1&&!a.quantMode&&(l.quantMode=f.quantMode),f.labelProps&&!a.labelProps&&(l.labelProps=new Set(f.labelProps.filter(_=>l.groupNames.includes(_)))),l._quantStats={}}l.levels=new Array(se.length).fill(null),await l._blend(),l._progressText=null,l._refreshPropCache(),l.layoutAll(),l.render()})(),l}function co(e,t,o,n){let s=o.length,r=e.map((u,c)=>{let d={};for(let p=0;p<s;p++){let h=(c*s+p)*2;d[o[p]]=[t[h],t[h+1]]}return{...u,projections:d,px:0,py:0,gx:0,gy:0,x:0,y:0}}),i=Object.fromEntries(r.map(u=>[u.id,u])),a=Object.fromEntries(r.map(u=>[u.id,[]]));for(let u of n)a[u.src]&&a[u.dst]&&(a[u.src].push(u.dst),a[u.dst].push(u.src));return{nodes:r,nodeIndexFull:i,adjList:a}}function et(e,t,o,n={}){let s=ro(t,o),{nodes:r,nodeIndexFull:i,adjList:a}=co(s.nodeArray,s.projBuf,s.groupNames,s.edges);return ao(e,r,s.edges,i,a,s.groupNames,s.hasEdgeTypes,n)}function Et(e,t,o,n={}){let s={},r={},i=t.map(f=>{let _=f.id,M=f.group||"unknown",S=f.label||_,v={};for(let y in f)y!=="id"&&y!=="group"&&y!=="label"&&(v[y]=f[y]);let x={id:_,group:M,label:S,degree:0,edgeTypes:null,extraProps:v};return s[_]=x,r[_]=[],x}),a=[];for(let f of o)s[f.src]&&s[f.dst]&&(a.push(f),s[f.src].degree++,s[f.dst].degree++,r[f.src].push(f.dst),r[f.dst].push(f.src));let u=[];if(i.length>0)for(let f of Object.keys(i[0].extraProps))u.push(f);let c=["group","label","structure","neighbors"];for(let f of u)c.push(f);let d=i.map(f=>r[f.id].map(_=>s[_].group)),p={};for(let f of u){let _=0,M=0,S=1/0,v=-1/0;for(let x of i){let y=x.extraProps[f];if(y==null||y==="")continue;M++;let A=Number(y);isFinite(A)&&(_++,A<S&&(S=A),A>v&&(v=A))}M>0&&_/M>=.8&&v>S&&(p[f]={min:S,max:v,coarse:5,medium:50,fine:500})}let{projBuf:h}=St(i,d,c,!1,u,p),{nodes:l,nodeIndexFull:m,adjList:g}=co(i,h,c,a);return ao(e,l,a,m,g,c,!1,n)}var lo={level:{prop:"initialLevel",type:"int",default:3},heatmap:{prop:"heatmapMode",type:"string",default:"off"},"edge-mode":{prop:"edgeMode",type:"string",default:"curves"},quant:{prop:"quantMode",type:"string",default:"gaussian"},alpha:{prop:"smoothAlpha",type:"float",default:0},"color-scheme":{prop:"colorScheme",type:"int",default:ct},"size-by":{prop:"sizeBy",type:"string",default:"edges"},webgl:{prop:"webgl",type:"bool",default:!1},"auto-gpu":{prop:"autoGPU",type:"bool",default:!0},"use-gpu":{prop:"useGPU",type:"bool",default:!1},"color-by":{prop:"colorBy",type:"string",default:null},"auto-tune":{prop:"autoTune",type:"json",default:null}},Tn=["legend","reset-btn","light-mode","size-log","webgl","auto-gpu"];function Fn(e,t){if(e!=null)switch(t){case"int":return parseInt(e,10)||0;case"float":return parseFloat(e)||0;case"bool":return e!=="false"&&e!=="0";case"string":return e;case"json":try{return JSON.parse(e)}catch{return null}default:return e}}var tt=class extends HTMLElement{static get observedAttributes(){return["edges","nodes","format",...Object.keys(lo),...Tn]}constructor(){super(),this._view=null,this._shadow=this.attachShadow({mode:"open"}),this._shadow.innerHTML=`<style>
      :host { display: block; position: relative; }
      .wrap { width: 100%; height: 100%; position: relative; }
      canvas { width: 100%; height: 100%; display: block; background: var(--bz-bg, #12122a); }
    </style><div class="wrap"><canvas></canvas></div>`,this._canvas=this._shadow.querySelector("canvas")}connectedCallback(){requestAnimationFrame(()=>this._init())}disconnectedCallback(){this._view&&(this._view.destroy(),this._view=null)}async _init(){if(this._view)return;let t=this._buildOpts(),o=this.getAttribute("edges"),n=this.getAttribute("nodes"),s=this.getAttribute("format"),r=this.textContent.trim();if(o){let[i,a]=await Promise.all([fetch(o).then(u=>u.text()),n?fetch(n).then(u=>u.text()).catch(()=>null):Promise.resolve(null)]);this._view=et(this._canvas,i,a,t)}else if(r&&s==="json"){let i=JSON.parse(r),a=i.nodes||[],u=i.edges||[];this._view=Et(this._canvas,a,u,t)}else if(r){let i=r.split(`
`),a=r,u=null,c=i.findIndex((d,p)=>p>0&&d.startsWith("# ")&&i[p-1].trim()==="");c>0&&(a=i.slice(0,c-1).join(`
`),u=i.slice(c).join(`
`)),this._view=et(this._canvas,a,u,t)}}_buildOpts(){let t={},o=this.getAttribute("weights");if(o){t.weights={};for(let s of o.split(",")){let[r,i]=s.split(":");r&&i&&(t.weights[r.trim()]=parseFloat(i.trim())||0)}}let n=this.getAttribute("label-props");n&&(t.labelProps=n.split(",").map(s=>s.trim()));for(let[s,r]of Object.entries(lo)){let i=this.getAttribute(s);i!==null&&(t[r.prop]=Fn(i,r.type))}return this.hasAttribute("legend")&&(t.showLegend=!0),this.hasAttribute("reset-btn")&&(t.showResetBtn=!0),this.hasAttribute("light-mode")&&(t.lightMode=!0),this.hasAttribute("size-log")&&(t.sizeLog=!0),t}get view(){return this._view}attributeChangedCallback(t,o,n){if(!this._view||o===n)return;let s=this._view;switch(t){case"level":s.switchLevel(parseInt(n)||0);break;case"alpha":s.setAlpha(parseFloat(n)||0);break;case"color-scheme":s.colorScheme=parseInt(n)||0;break;case"light-mode":s.lightMode=this.hasAttribute("light-mode");break;case"legend":s.showLegend=this.hasAttribute("legend")?1:0,s.render();break;case"heatmap":s.setOptions({heatmapMode:n||"off"}),s.render();break;case"edge-mode":s.setOptions({edgeMode:n||"curves"}),s.render();break;case"color-by":s.colorBy=n||null;break}}};customElements.define("bz-graph",tt);function De(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function uo(e,t){return t.sizeLog?Math.log2(e+1):e}function In(e){return(e*2654435761>>>0&2147483647)/2147483648}function Hn(e){return Math.min(5e3,Math.max(200,e*3))}function kn(e,t={}){let o=e.W,n=e.H,s=e.renderZoom,r=e.currentLevel===ie,i=t.background!==!1,a=t.grid!==!1,u=t.edges!==!1,c=t.labels!==!1,d=t.legend!==!1&&e.showLegend,p=e._lightMode,h=[],l=t.metadata?` | ${t.metadata}`:"";if(h.push(`<!-- Generated by BitZoom${l} \u2014 https://github.com/wistrand/bitzoom -->`),h.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${o}" height="${n}" viewBox="0 0 ${o} ${n}">`),i){let B=p?"#ffffff":"#12122a";h.push(`<rect width="${o}" height="${n}" fill="${B}"/>`)}if(a){let B=40*s;if(B>=4){let I=p?"rgba(100,100,140,0.15)":"rgba(60,60,100,0.3)",C=e.pan.x%B,j=e.pan.y%B;h.push(`<g stroke="${I}" stroke-width="0.5">`);for(let D=C;D<o;D+=B)h.push(`<line x1="${D.toFixed(1)}" y1="0" x2="${D.toFixed(1)}" y2="${n}"/>`);for(let D=j;D<n;D+=B)h.push(`<line x1="0" y1="${D.toFixed(1)}" x2="${o}" y2="${D.toFixed(1)}"/>`);h.push("</g>")}}let m,g,f,_,M,S,v;if(r)m=e.nodes,g=e.edges,f=Math.min(o,n)*s/256,_=B=>e._nodeColor(B),M=B=>B.id,S=B=>e.sizeBy==="edges"?B.degree:1,v=B=>e._nodeLabel(B);else{let B=e.getLevel(e.currentLevel);m=B.supernodes,g=B.snEdges||[];let I=1<<se[e.currentLevel];f=Math.min(o,n)*s/I,_=C=>C.cachedColor,M=C=>C.bid,S=C=>e.sizeBy==="edges"?C.totalDegree:C.members.length,v=C=>C.cachedLabel}if(u&&e.edgeMode!=="none"){let B=Math.sqrt(o*o+n*n),I=B*1.2,C=I*I,j=B*.25,D=j*j,Z=I-j,N=Hn(m.length),G=(r?e.edges.length:g.length)>N?N/(r?e.edges.length:g.length):1,W=r?[100,100,140]:[124,106,247],T=r?.25:.4,V;if(r)V=e.nodeIndexFull;else{let O=e.getLevel(e.currentLevel);if(!O._snByBid){O._snByBid=new Map;for(let U of O.supernodes)O._snByBid.set(U.bid,U)}V=O._snByBid}let X=r?O=>V[O]:O=>V.get(O),K=r?O=>O.src:O=>O.a,P=r?O=>O.dst:O=>O.b,$=r?()=>1:O=>O.weight,Q=r?e.edges:g;h.push('<g fill="none">');let k=0;for(let O=0;O<Q.length;O++){let U=Q[O],q=X(K(U)),Y=X(P(U));if(!q||!Y)continue;let J=q.x*s+e.pan.x,z=q.y*s+e.pan.y,ce=Y.x*s+e.pan.x,le=Y.y*s+e.pan.y,Ue=J-ce,bt=z-le,Ne=Ue*Ue+bt*bt;if(Ne>C||G<1&&In(O)>G*(2-Ne/C))continue;if(++k>N)break;let Bt=Ne<=D?1:Math.max(0,1-(Math.sqrt(Ne)-j)/Z),ho=$(U),Pt=r?T*Bt:Math.min(T,.05+ho*.05)*Bt;if(Pt<.01)continue;let ot=`rgba(${W[0]},${W[1]},${W[2]},${Pt.toFixed(3)})`;if(e.edgeMode==="curves"){let Pe=ce-J,Re=le-z,fe=Math.sqrt(Pe*Pe+Re*Re);if(fe<1)h.push(`<line x1="${J.toFixed(1)}" y1="${z.toFixed(1)}" x2="${ce.toFixed(1)}" y2="${le.toFixed(1)}" stroke="${ot}" stroke-width="1"/>`);else{let Rt=-Re/fe,Ct=Pe/fe,fo=J+Pe*.3+Rt*fe*.15,po=z+Re*.3+Ct*fe*.15,go=J+Pe*.7+Rt*fe*.05,mo=z+Re*.7+Ct*fe*.05;h.push(`<path d="M${J.toFixed(1)},${z.toFixed(1)} C${fo.toFixed(1)},${po.toFixed(1)} ${go.toFixed(1)},${mo.toFixed(1)} ${ce.toFixed(1)},${le.toFixed(1)}" stroke="${ot}" stroke-width="1"/>`)}}else h.push(`<line x1="${J.toFixed(1)}" y1="${z.toFixed(1)}" x2="${ce.toFixed(1)}" y2="${le.toFixed(1)}" stroke="${ot}" stroke-width="1"/>`)}h.push("</g>")}let x=r?Math.max(1,Math.min(f*.4,20)):Math.max(1.5,Math.min(f*.42,40)),y=r?1:1.5,A=r?1:1.2,w=0,E=1,b=f*.5;for(let B of m){let I=B.x*s+e.pan.x,C=B.y*s+e.pan.y;if(I>=-b&&I<=o+b&&C>=-b&&C<=n+b){w++;let j=uo(S(B),e);j>E&&(E=j)}}let R=e.selectedIds,F=e.hoveredId,H=[],L=[];for(let B of m){let I=B.x*s+e.pan.x,C=B.y*s+e.pan.y;if(I<-x||I>o+x||C<-x||C>n+x)continue;let j=S(B),D=uo(j,e),Z=Math.max(y,Math.min(x,y+Math.sqrt(D)*A)),N=_(B),G=M(B),W=R.has(G),T=F===G,V=w>50?.3+.7*Math.sqrt(D/E):1,X,K,P;if(r?(X=W?1:T?.8:187/255,K=W?"#fff":N,P=W?1:0):(X=W?1:T?.8:V*153/255,K=W?"#fff":N,P=W||T?1:V),H.push(`<circle cx="${I.toFixed(1)}" cy="${C.toFixed(1)}" r="${Z.toFixed(1)}" fill="${N}" fill-opacity="${X.toFixed(2)}" stroke="${K}" stroke-opacity="${P.toFixed(2)}" stroke-width="${W?2:1}"/>`),c&&(W||T||w<=50&&f>=20||w<=150&&V>.7&&f>=20)){let Q=v(B),k=Q.split(" \xB7 "),O=k.length>1&&e.labelProps.has("label"),U=W||T?Math.max(11,Math.min(12,f*.18))|0:Math.max(10,Math.min(13,f*.18))|0,q=p?W?"#111":T?"rgba(30,30,60,0.9)":"rgba(50,50,80,0.8)":W?"#fff":T?"rgba(230,230,255,0.95)":"rgba(220,220,255,0.85)",Y=W||T?' font-weight="bold"':"";if(O)L.push(`<text x="${I.toFixed(1)}" y="${(C-Z-3).toFixed(1)}" text-anchor="middle" dominant-baseline="auto" fill="${q}" font-size="${U}"${Y}>${De(k[0])}</text>`),L.push(`<text x="${I.toFixed(1)}" y="${(C+Z+3+U).toFixed(1)}" text-anchor="middle" dominant-baseline="auto" fill="${q}" font-size="${Math.max(9,U-1)}">${De(k.slice(1).join(" \xB7 "))}</text>`);else{let J=U*.6,z=W||T?999:Math.max(3,f/J|0),ce=Q.length>z?Q.slice(0,z-1)+"\u2026":Q;L.push(`<text x="${I.toFixed(1)}" y="${(C-Z-3).toFixed(1)}" text-anchor="middle" dominant-baseline="auto" fill="${q}" font-size="${U}"${Y}>${De(ce)}</text>`)}}}if(h.push("<g>"+H.join("")+"</g>"),L.length>0&&h.push('<g font-family="JetBrains Mono, monospace">'+L.join("")+"</g>"),d){let B=e._cachedColorMap;if(B){let I=Object.entries(B);if(I.length>0){let C={};for(let J of m){let z=r?e._nodeColorVal(J):J.cachedColorVal||"";C[z]=(C[z]||0)+1}I.sort((J,z)=>(C[z[0]]||0)-(C[J[0]]||0));let D=I.slice(0,12),Z=I.length-D.length,N=10,G=4,W=16,T=8,V=14,X=e._cachedDominant.toUpperCase(),K=120,P=V+D.length*W+(Z>0?W:0)+T*2,$=e.showLegend||1,Q=8,k=$===2||$===3?Q:o-K-Q,O=$===3||$===4?Q:n-P-Q,U=p?"rgba(255,255,255,0.85)":"rgba(10,10,15,0.75)",q=p?"#333340":"#c8c8d8",Y=p?"#6a6a80":"#8888a0";h.push('<g font-family="JetBrains Mono, monospace">'),h.push(`<rect x="${k}" y="${O}" width="${K}" height="${P}" rx="4" fill="${U}"/>`),h.push(`<text x="${k+T}" y="${O+T+8}" fill="${Y}" font-size="8" font-weight="bold">${De(X)}</text>`);for(let J=0;J<D.length;J++){let[z,ce]=D[J],le=O+T+V+J*W+W/2;h.push(`<circle cx="${k+T+G}" cy="${le}" r="${G}" fill="${ce}"/>`);let Ue=z.length>14?z.slice(0,13)+"\u2026":z;h.push(`<text x="${k+T+G*2+6}" y="${le+3}" fill="${q}" font-size="${N}">${De(Ue)}</text>`)}if(Z>0){let J=O+T+V+D.length*W+W/2;h.push(`<text x="${k+T}" y="${J+3}" fill="${Y}" font-size="${N}">+${Z} more</text>`)}h.push("</g>")}}}return h.push("</svg>"),h.join(`
`)}export{ze as BitZoomCanvas,tt as BzGraph,lt as COLOR_SCHEME_NAMES,Fo as SCHEME_DIVERGING,To as SCHEME_GRAYSCALE,Io as SCHEME_GREENS,Ro as SCHEME_INFERNO,Po as SCHEME_PLASMA,Ho as SCHEME_REDS,Co as SCHEME_THERMAL,Bo as SCHEME_VIRIDIS,ct as SCHEME_VIVID,ut as autoTuneWeights,Et as createBitZoomFromGraph,et as createBitZoomView,kn as exportSVG,Ge as generateGroupColors,Lt as initGPU,Go as isWebGL2Available};

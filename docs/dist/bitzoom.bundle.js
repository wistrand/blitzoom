function _e(e){let t="",o=-1;for(let n in e)e[n]>o&&(o=e[n],t=n);return t}var Y=128,ue=2147483647,be=16,z=1<<be,ne=[1,2,3,4,5,6,7,8,9,10,11,12,13,14],se=14,Xe=["L1","L2","L3","L4","L5","L6","L7","L8","L9","L10","L11","L12","L13","L14","RAW"],$e=.1,Qe=.1;function Mt(e){return function(){e|=0,e=e+1831565813|0;let t=Math.imul(e^e>>>15,1|e);return t=t+Math.imul(t^t>>>7,61|t)^t,((t^t>>>14)>>>0)/4294967296}}var yt=Mt(42),He=new Int32Array(Y),Oe=new Int32Array(Y);for(let e=0;e<Y;e++)He[e]=Math.floor(yt()*(ue-1))+1,Oe[e]=Math.floor(yt()*(ue-1));function Ke(e){let t=0;for(let o=0;o<e.length;o++)t=Math.imul(31,t)+e.charCodeAt(o)|0;return t>>>0}var te=new Int32Array(Y);function xt(e){return e=(e&ue)+(e/2147483648|0),e>=ue?e-ue:e}function vt(e,t,o){let n=t>>>16,s=t&65535,r=xt(e*n);return xt(r*65536+e*s+o)}var Ee=new Uint8Array(Y);function he(e,t){if(t===0){for(let o=0;o<Y;o++)te[o]=-1;return}if(t<12){for(let o=0;o<Y;o++)te[o]=ue;for(let o=0;o<t;o++){let n=Ke(e[o]);for(let s=0;s<Y;s++){let r=vt(He[s],n,Oe[s]);r<te[s]&&(te[s]=r)}}return}for(let o=0;o<Y;o++)te[o]=ue,Ee[o]=0;for(let o=0;o<t;o++){let n=Ke(e[o]),s=vt(He[0],n,Oe[0]),r=s%Y,i=s/Y|0;i<te[r]&&(te[r]=i,Ee[r]=1)}for(let o=0;o<Y;o++){if(Ee[o])continue;let n=(o*2654435761>>>0)%Y,s=0;for(;!Ee[n]&&s<Y;)n=(n*2654435761+1>>>0)%Y,s++;Ee[n]&&(te[o]=te[n])}}function Le(e,t){let o=Mt(e),n=[new Float64Array(t),new Float64Array(t)];for(let s=0;s<2;s++)for(let r=0;r<t;r+=2){let i=Math.max(1e-10,o()),a=o(),l=Math.sqrt(-2*Math.log(i));n[s][r]=l*Math.cos(2*Math.PI*a),r+1<t&&(n[s][r+1]=l*Math.sin(2*Math.PI*a))}return n}function fe(e,t,o,n){if(e[0]===-1){o[n]=0,o[n+1]=0;return}let s=0;for(let f=0;f<Y;f++)s+=e[f];s/=Y;let r=0;for(let f=0;f<Y;f++){let d=e[f]-s;r+=d*d}let i=Math.sqrt(r/Y)||1,a=t[0],l=t[1],c=0,h=0;for(let f=0;f<Y;f++){let d=(e[f]-s)/i;c+=d*a[f],h+=d*l[f]}o[n]=c,o[n+1]=h}function Ge(e,t,o){let n=be-o,s=e>>n,r=t>>n;return s<<o|r}function Re(e){let t=e.length,o=e.map((s,r)=>({i:r,v:s.px,id:s.id})).sort((s,r)=>s.v-r.v||(s.id<r.id?-1:s.id>r.id?1:0));for(let s=0;s<t;s++)e[o[s].i].gx=Math.min(z-1,Math.floor(s/t*z)),e[o[s].i].px=s/t*2-1;let n=e.map((s,r)=>({i:r,v:s.py,id:s.id})).sort((s,r)=>s.v-r.v||(s.id<r.id?-1:s.id>r.id?1:0));for(let s=0;s<t;s++)e[n[s].i].gy=Math.min(z-1,Math.floor(s/t*z)),e[n[s].i].py=s/t*2-1}var ye=8192,me=new Float64Array(ye+1);{let e=t=>{let i=Math.abs(t),a=1/(1+.278393*i+.230389*i*i+972e-6*i*i*i+.078108*i*i*i*i),l=1-a*a*a*a;return t>=0?l:-l};for(let t=0;t<=ye;t++){let o=t/ye*8-4;me[t]=.5*(1+e(o*Math.SQRT1_2))}}function At(e){let t=(e+4)*(ye/8),o=t|0;if(o>=ye)return me[ye];if(o<0)return me[0];let n=t-o;return me[o]+n*(me[o+1]-me[o])}function Pe(e,t){let o=e.length;if(o===0)return;let n,s,r,i;if(t&&t._initialized)n=t.mx,s=t.my,r=t.sx,i=t.sy;else{let a=0,l=0;for(let f=0;f<o;f++)a+=e[f].px,l+=e[f].py;n=a/o,s=l/o;let c=0,h=0;for(let f=0;f<o;f++){let d=e[f].px-n,u=e[f].py-s;c+=d*d,h+=u*u}r=Math.sqrt(c/o)||1,i=Math.sqrt(h/o)||1,t&&(t.mx=n,t.my=s,t.sx=r,t.sy=i,t._initialized=!0)}for(let a=0;a<o;a++){let l=At((e[a].px-n)/r),c=At((e[a].py-s)/i);e[a].gx=Math.min(z-1,Math.floor(l*z)),e[a].gy=Math.min(z-1,Math.floor(c*z)),e[a].px=l*2-1,e[a].py=c*2-1}}function Be(e,t,o,n,s,r,i,a,l){let c=o,h=0;for(let A of t){let M=c[A]||0;M>h&&(h=M)}let f=Math.max(h*$e,Qe),d=0,u={};for(let A of t)u[A]=Math.max(c[A]||0,f),d+=u[A];let m=e.length,p=new Float64Array(m),g=new Float64Array(m);for(let A=0;A<m;A++){let M=e[A],y=0,x=0;for(let v of t){let S=M.projections[v];S&&(y+=S[0]*u[v],x+=S[1]*u[v])}p[A]=y/d,g[A]=x/d,M.px=p[A],M.py=g[A]}let _=()=>a==="gaussian"?Pe(e,l):Re(e);if(n===0||i===0){_();return}let w=Math.max(0,Math.min(1,n));for(let A=0;A<i;A++){let M=new Float64Array(m),y=new Float64Array(m);for(let x=0;x<m;x++){let v=e[x],S=s[v.id];if(S&&S.length>0){let b=0,B=0,C=0;for(let R of S){let P=r[R];P&&(b+=P.px,B+=P.py,C++)}C>0?(b/=C,B/=C,M[x]=(1-w)*p[x]+w*b,y[x]=(1-w)*g[x]+w*B):(M[x]=p[x],y[x]=g[x])}else M[x]=p[x],y[x]=g[x]}for(let x=0;x<m;x++)e[x].px=M[x],e[x].py=y[x]}_()}function wt(e,t,o,n,s){let r=new Map;for(let a=0;a<t.length;a++){let l=t[a],c=Ge(l.gx,l.gy,e),h=r.get(c);h||(h=[],r.set(c,h)),h.push(l)}let i=[];for(let[a,l]of r){let c=a>>e,h=a&(1<<e)-1,f={},d={},u={},m=0,p=0,g=0,_=-1,w=l[0];for(let R=0;R<l.length;R++){let P=l[R];if(p+=P.px,g+=P.py,f[P.group]=(f[P.group]||0)+1,o){let E=o(P);d[E]=(d[E]||0)+1}if(n){let E=n(P);u[E]=(u[E]||0)+1}m+=P.degree,P.degree>_&&(_=P.degree,w=P)}let A=p/l.length,M=g/l.length,y=_e(f),x=m/l.length,v=m,S=w.label||w.id,b=o?_e(d):y,B=s&&s(b)||"#888888",C=n?_e(u):S;i.push({bid:a,members:l,ax:A,ay:M,domGroup:y,avgDegree:x,totalDegree:v,repName:S,cachedColorVal:b,cachedColor:B,cachedLabel:C,x:0,y:0,cx:c,cy:h})}return{supernodes:i,snEdges:[],level:e,_edgesReady:!1}}function ae(e,t,o){if(t==="label")return e.label||e.id;if(t==="group")return e.group||"unknown";if(t==="structure")return`deg:${e.degree}`;if(t==="neighbors")return`${(o[e.id]||[]).length} nbrs`;if(t==="edgetype"&&e.edgeTypes){let n=Array.isArray(e.edgeTypes)?e.edgeTypes:[...e.edgeTypes];return n.length>0?n[0]:e.id}if(e.extraProps&&Object.prototype.hasOwnProperty.call(e.extraProps,t)){let n=e.extraProps[t];return n!=null?String(n):e.label||e.id}return e.label||e.id}function Je(e,t,o){if(t==="label")return e.repName;let n={};for(let s of e.members){let r=ae(s,t,o);n[r]=(n[r]||0)+1}return _e(n)}function $t(e,t,o){t/=100,o/=100;let n=t*Math.min(o,1-o),s=r=>{let i=(r+e/30)%12,a=o-n*Math.max(Math.min(i-3,9-i,1),-1);return Math.round(255*a).toString(16).padStart(2,"0")};return`#${s(0)}${s(8)}${s(4)}`}function Qt(e,t,o){return"#"+((1<<24)+(e<<16)+(t<<8)+o).toString(16).slice(1)}function Jt(e,t){t=Math.max(0,Math.min(1,t));let o=t*(e.length-1),n=Math.floor(o),s=Math.min(n+1,e.length-1),r=o-n;return Qt(Math.round(e[n][0]+(e[s][0]-e[n][0])*r),Math.round(e[n][1]+(e[s][1]-e[n][1])*r),Math.round(e[n][2]+(e[s][2]-e[n][2])*r))}function ce(e){return t=>{let o={},n=t.length;for(let s=0;s<n;s++)o[t[s]]=Jt(e,n===1?.5:s/(n-1));return o}}var zt=[[72,35,116],[64,67,135],[52,94,141],[41,120,142],[32,144,140],[34,167,132],[68,190,112],[121,209,81],[189,222,38],[253,231,37]],eo=[[126,3,167],[168,34,150],[203,70,121],[229,107,93],[248,148,65],[253,195,40],[239,248,33]],to=[[106,23,110],[147,38,103],[188,55,84],[221,81,58],[243,118,27],[252,165,10],[246,215,70],[252,255,164]],oo=[[80,50,155],[120,40,160],[165,30,140],[200,35,100],[225,60,60],[240,100,30],[250,155,15],[255,220,50]],no=[[45,100,55],[60,135,65],[80,165,80],[100,190,100],[130,210,130],[170,228,160],[210,243,200]],so=[[140,30,30],[175,40,35],[210,55,40],[230,80,50],[240,120,75],[248,165,110],[252,210,165]],ro=[[69,117,180],[116,173,209],[171,217,233],[224,243,248],[255,255,191],[254,224,144],[253,174,97],[244,109,67],[215,48,39]],io=[[90,90,100],[120,120,130],[150,150,160],[180,180,190],[210,210,218],[235,235,242]],ze=0,ao=1,co=2,lo=3,uo=4,ho=5,fo=6,po=7,go=8,et=["vivid","viridis","plasma","inferno","thermal","grayscale","diverging","greens","reds"],Ce=[e=>{let t={};for(let n=0;n<e.length;n++)t[e[n]]=$t(n*137.508%360,65,62);return t},ce(zt),ce(eo),ce(to),ce(oo),ce(io),ce(ro),ce(no),ce(so)];function Te(e,t=0){return Ce[t%Ce.length](e)}function mo(e,t){let o=16-t,n=1<<t,s=n*n,r=new Map;for(let u=0;u<e.length;u++){let m=(e[u].gx>>o)*n+(e[u].gy>>o);r.set(m,(r.get(m)||0)+1)}let i=r.size;if(i<=1)return 0;let a=i/s,l=0,c=0;for(let u of r.values())l+=u,c+=u*u;let h=l/i,f=c/i-h*h,d=Math.sqrt(Math.max(0,f))/Math.max(1,h);return a*d}function _o(e,t){t==="gaussian"?Pe(e,{}):Re(e)}var St=()=>new Promise(e=>requestAnimationFrame(e));async function tt(e,t,o,n,s={}){let r=performance.now(),i=s.weights!==!1,a=s.alpha!==!1,l=s.quant!==!1,c=s.onProgress,h=s.signal,f=s.timeout??2e4,d=[0,3,8,10],u=[0,.25,.5,.75,1],m=l?["rank","gaussian"]:["gaussian"],p=a?u:[0],g=Math.max(3,Math.min(7,Math.round(Math.log2(e.length)-2))),_=new Set(["label","structure","neighbors"]),w=t.filter(T=>{if(_.has(T))return!1;if(T==="edgetype"){let j=new Set;for(let D of e){if(D.edgeTypes)for(let q of D.edgeTypes)j.add(q);if(j.size>2)return!0}return!1}return!0}),A=!1;if(i)for(let T of w){let j=new Set;for(let D of e){let q=T==="group"?D.group:D.extraProps&&D.extraProps[T]||void 0;if(j.add(q),j.size>1){A=!0;break}}if(A)break}let M=i&&A,y=-1,x={},v=0,S="gaussian",b=0,B=0,C=0,R=w.length,P=(M?R+2:1)*p.length,E=(M?R*d.length:0)+(a?u.length:0),F=P+E*3,H=performance.now(),G=!1,N=()=>h?.aborted||f>0&&performance.now()-r>f,Z=async T=>{if(N()){G=!0;return}performance.now()-H>50&&(c&&c({phase:T,step:C,total:F,score:y}),await St(),H=performance.now(),N()&&(G=!0))},J=async T=>{if(N()){G=!0;return}c&&c({phase:T,step:C,total:F,score:y}),await St(),H=performance.now(),N()&&(G=!0)},W=new Float64Array(e.length),I=new Float64Array(e.length),U=s.blendFn||Be,O=(T,j)=>{U(e,t,T,j,o,n,5,"gaussian",{}),b++;for(let $=0;$<e.length;$++)W[$]=e[$].px,I[$]=e[$].py;let D=-1,q="gaussian";for(let $ of m){for(let ie=0;ie<e.length;ie++)e[ie].px=W[ie],e[ie].py=I[ie];_o(e,$),B++;let le=mo(e,g);le>D&&(D=le,q=$)}return C++,{score:D,quant:q}},k=[],Q={};for(let T of t)Q[T]=w.includes(T)?3:0;if(k.push(Q),M)for(let T of w){let j={};for(let D of t)j[D]=D===T?8:0;k.push(j)}await J("presets");let X=[];for(let T=0;T<k.length&&!G;T++){let j=k[T];for(let D of p){let{score:q,quant:$}=O(j,D);if(q>y&&(y=q,x={...j},v=D,S=$),T>0&&D===0&&X.push({group:w[T-1],score:q}),await Z("presets"),G)break}}if(M&&X.length>=2&&!G){X.sort((q,$)=>$.score-q.score);let T=X[0].group,j=X[1].group,D={};for(let q of t)D[q]=q===T||q===j?5:0;for(let q of p){if(G)break;let{score:$,quant:le}=O(D,q);$>y&&(y=$,x={...D},v=q,S=le),await Z("presets")}}for(let T=0;T<3&&!G;T++){let j=!1;if(await J("descent"),G)break;if(M)for(let D of w){if(G)break;let q=x[D];for(let $ of d){x[D]=$;let{score:le,quant:ie}=O(x,v);if(le>y&&(y=le,q=$,S=ie,j=!0),await Z("descent"),G)break}x[D]=q}if(a&&!G)for(let D of u){let{score:q,quant:$}=O(x,D);if(q>y&&(y=q,v=D,S=$,j=!0),await Z("descent"),G)break}if(!j)break}Be(e,t,x,v,o,n,5,S,{}),c&&c({phase:"done",step:F,total:F,score:y});let L=[],V=0,ee=null;for(let T of w)(x[T]||0)>V&&(V=x[T]||0,ee=T);if(ee&&ee!=="label"&&L.push(ee),t.includes("label")){let T=new Set;for(let j of e)if(T.add(j.label||j.id),T.size>e.length*.8)break;T.size>1&&T.size<=e.length*.8&&L.push("label")}return{weights:x,alpha:v,quantMode:S,labelProps:L,score:y,blends:b,quants:B,timeMs:Math.round(performance.now()-r)}}function yo(){try{let e=document.createElement("canvas");e.addEventListener("webglcontextlost",o=>o.preventDefault());let t=e.getContext("webgl2");return t?(t.getExtension("WEBGL_lose_context")?.loseContext(),!0):!1}catch{return!1}}function Lt(e){let t=e.getContext("webgl2",{alpha:!1,antialias:!1});if(!t)return console.log("[GL] WebGL2 context creation failed"),null;if(console.log("[GL] WebGL2 context created"),t.getExtension("EXT_color_buffer_half_float"),t.getExtension("EXT_color_buffer_float"),t.getExtension("EXT_float_blend"),t._hasFloatLinear=!!t.getExtension("OES_texture_float_linear"),t.getExtension("EXT_color_buffer_float"),t._circleProgram=To(t),!t._circleProgram)return console.log("[GL] Circle shader compilation failed"),null;let o=new Float32Array([-1,-1,1,-1,-1,1,1,1]);t._quadVBO=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,t._quadVBO),t.bufferData(t.ARRAY_BUFFER,o,t.STATIC_DRAW);let n=new Float32Array([0,-1,1,-1,0,1,1,1]);t._edgeLineQuadVBO=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,t._edgeLineQuadVBO),t.bufferData(t.ARRAY_BUFFER,n,t.STATIC_DRAW);let s=16;t._curveSegCount=s;let r=new Float32Array((s+1)*4);for(let i=0;i<=s;i++){let a=i/s;r[i*4]=a,r[i*4+1]=-1,r[i*4+2]=a,r[i*4+3]=1}return t._edgeCurveVBO=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,t._edgeCurveVBO),t.bufferData(t.ARRAY_BUFFER,r,t.STATIC_DRAW),t._instanceVBO=t.createBuffer(),t._edgeLineProgram=Et(t,Po),t._edgeCurveProgram=Et(t,Bo),!t._edgeLineProgram||!t._edgeCurveProgram?(console.log("[GL] Edge shader compilation failed"),null):(t._gridProgram=Io(t),t._gridProgram?(t._heatSplatProg=Fo(t),t._heatResolveProg=Ho(t),!t._heatSplatProg||!t._heatResolveProg?(console.log("[GL] Heatmap shader compilation failed"),null):(t._fsQuadVBO=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,t._fsQuadVBO),t.bufferData(t.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),t.STATIC_DRAW),t._heatFBO=null,t._heatTex=null,t._heatW=0,t._heatH=0,t._heatMaxW=0,t._heatMaxWTarget=0,t._heatMaxWKey="",t._heatFBOBroken=!1,t._heatMaxWTime=0,t._circleVAO=Wo(t),t._edgeLineVAO=bt(t,t._edgeLineQuadVBO),t._edgeCurveVAO=bt(t,t._edgeCurveVBO),t._heatResolveVAO=Oo(t),t)):(console.log("[GL] Grid shader compilation failed"),null))}var xo=`#version 300 es
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
`,vo=`#version 300 es
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
`,Ao=`#version 300 es
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
`,Mo=`#version 300 es
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
`,wo=`#version 300 es
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
`,So=`#version 300 es
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
`,Eo=`#version 300 es
precision highp float;
layout(location = 0) in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`,bo=`#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_density;
uniform float u_maxW;

out vec4 fragColor;

void main() {
  vec4 d = texture(u_density, v_uv);
  float w = d.a;
  if (w < 0.001) discard;
  float intensity = min(1.0, w / (u_maxW * 0.3));
  vec3 col = d.rgb / w * intensity;
  fragColor = vec4(col, intensity * 0.7);
}
`,Lo=`#version 300 es
precision highp float;
layout(location = 0) in vec2 a_pos;
out vec2 v_screenPos;
uniform vec2 u_resolution;
void main() {
  v_screenPos = (a_pos * 0.5 + 0.5) * u_resolution;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`,Ro=`#version 300 es
precision highp float;

in vec2 v_screenPos;
uniform float u_gridSize;
uniform vec2 u_pan;

out vec4 fragColor;

void main() {
  // Grid line at every u_gridSize pixels, offset by pan
  vec2 p = v_screenPos - u_pan;
  vec2 g = abs(fract(p / u_gridSize + 0.5) - 0.5) * u_gridSize;
  float d = min(g.x, g.y);
  // Match Canvas 2D lineWidth 0.5: very thin line with AA
  float line = 1.0 - smoothstep(0.0, 1.0, d);
  if (line < 0.01) discard;
  fragColor = vec4(60.0/255.0, 60.0/255.0, 100.0/255.0, 0.3 * line);
}
`,Po=`#version 300 es
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
`,Bo=`#version 300 es
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
`,Co=`#version 300 es
precision highp float;

in vec4 v_color;
out vec4 fragColor;

void main() {
  fragColor = v_color;
}
`;function re(e,t,o){let n=e.createShader(t);return e.shaderSource(n,o),e.compileShader(n),e.getShaderParameter(n,e.COMPILE_STATUS)?n:(console.error("[GL] Shader compile:",e.getShaderInfoLog(n)),e.deleteShader(n),null)}function ve(e,t,o){let n=e.createProgram();return e.attachShader(n,t),e.attachShader(n,o),e.linkProgram(n),e.getProgramParameter(n,e.LINK_STATUS)?n:(console.error("[GL] Program link:",e.getProgramInfoLog(n)),e.deleteProgram(n),null)}function To(e){let t=re(e,e.VERTEX_SHADER,xo),o=re(e,e.FRAGMENT_SHADER,vo);if(!t||!o)return null;let n=ve(e,t,o);if(!n)return null;n.u_resolution=e.getUniformLocation(n,"u_resolution");let s=re(e,e.VERTEX_SHADER,Ao),r=re(e,e.FRAGMENT_SHADER,Mo);if(!s||!r)return null;let i=ve(e,s,r);return i?(i.u_resolution=e.getUniformLocation(i,"u_resolution"),n._glow=i,n):null}function Io(e){let t=re(e,e.VERTEX_SHADER,Lo),o=re(e,e.FRAGMENT_SHADER,Ro);if(!t||!o)return null;let n=ve(e,t,o);return n?(n.u_resolution=e.getUniformLocation(n,"u_resolution"),n.u_gridSize=e.getUniformLocation(n,"u_gridSize"),n.u_pan=e.getUniformLocation(n,"u_pan"),n):null}function Fo(e){let t=re(e,e.VERTEX_SHADER,wo),o=re(e,e.FRAGMENT_SHADER,So);if(!t||!o)return null;let n=ve(e,t,o);return n?(n.u_resolution=e.getUniformLocation(n,"u_resolution"),n):null}function Ho(e){let t=re(e,e.VERTEX_SHADER,Eo),o=re(e,e.FRAGMENT_SHADER,bo);if(!t||!o)return null;let n=ve(e,t,o);return n?(n.u_density=e.getUniformLocation(n,"u_density"),n.u_maxW=e.getUniformLocation(n,"u_maxW"),n):null}function Oo(e){let t=e.createVertexArray();return e.bindVertexArray(t),e.bindBuffer(e.ARRAY_BUFFER,e._fsQuadVBO),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0),e.bindVertexArray(null),t}function Go(e,t,o){let n=Math.ceil(t/4),s=Math.ceil(o/4);if(e._heatW===n&&e._heatH===s)return;e._heatFBO&&e.deleteFramebuffer(e._heatFBO),e._heatTex&&e.deleteTexture(e._heatTex),e._heatTex=e.createTexture(),e.bindTexture(e.TEXTURE_2D,e._heatTex),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e._heatFBO=e.createFramebuffer(),e.bindFramebuffer(e.FRAMEBUFFER,e._heatFBO);let r=[{internal:e.RGBA16F,type:e.HALF_FLOAT,name:"RGBA16F"}];e._hasFloatLinear&&r.unshift({internal:e.RGBA32F,type:e.FLOAT,name:"RGBA32F"}),r.push({internal:e.RGBA8,type:e.UNSIGNED_BYTE,name:"RGBA8"});let i=!1;for(let a of r)if(e.texImage2D(e.TEXTURE_2D,0,a.internal,n,s,0,e.RGBA,a.type,null),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,e._heatTex,0),e.checkFramebufferStatus(e.FRAMEBUFFER)===e.FRAMEBUFFER_COMPLETE){a.name!=="RGBA32F"&&console.log(`[GL] Heatmap FBO using ${a.name}`),i=!0;break}i||(console.error("[GL] Heatmap FBO: no format works"),e._heatFBOBroken=!0),e.bindFramebuffer(e.FRAMEBUFFER,null),e._heatW=n,e._heatH=s}function Et(e,t){let o=re(e,e.VERTEX_SHADER,t),n=re(e,e.FRAGMENT_SHADER,Co);if(!o||!n)return null;let s=ve(e,o,n);return s?(s.u_resolution=e.getUniformLocation(s,"u_resolution"),s.u_width=e.getUniformLocation(s,"u_width"),s):null}function bt(e,t){let o=e.createVertexArray();e.bindVertexArray(o),e.bindBuffer(e.ARRAY_BUFFER,t),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0);let n=32;return e.bindBuffer(e.ARRAY_BUFFER,e._instanceVBO),e.enableVertexAttribArray(1),e.vertexAttribPointer(1,2,e.FLOAT,!1,n,0),e.vertexAttribDivisor(1,1),e.enableVertexAttribArray(2),e.vertexAttribPointer(2,2,e.FLOAT,!1,n,8),e.vertexAttribDivisor(2,1),e.enableVertexAttribArray(3),e.vertexAttribPointer(3,4,e.FLOAT,!1,n,16),e.vertexAttribDivisor(3,1),e.bindVertexArray(null),o}function Wo(e){let t=e.createVertexArray();e.bindVertexArray(t),e.bindBuffer(e.ARRAY_BUFFER,e._quadVBO),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0);let o=44;return e.bindBuffer(e.ARRAY_BUFFER,e._instanceVBO),e.enableVertexAttribArray(1),e.vertexAttribPointer(1,2,e.FLOAT,!1,o,0),e.vertexAttribDivisor(1,1),e.enableVertexAttribArray(2),e.vertexAttribPointer(2,1,e.FLOAT,!1,o,8),e.vertexAttribDivisor(2,1),e.enableVertexAttribArray(3),e.vertexAttribPointer(3,4,e.FLOAT,!1,o,12),e.vertexAttribDivisor(3,1),e.enableVertexAttribArray(4),e.vertexAttribPointer(4,4,e.FLOAT,!1,o,28),e.vertexAttribDivisor(4,1),e.bindVertexArray(null),t}var ot={};function at(e){if(ot[e])return ot[e];let t=parseInt(e.slice(1,3),16)/255,o=parseInt(e.slice(3,5),16)/255,n=parseInt(e.slice(5,7),16)/255,s=[t,o,n];return ot[e]=s,s}function Ae(e,t){return t.sizeLog?Math.log2(e+1):e}var nt=new Float32Array(0),st=new Float32Array(0),rt=new Float32Array(0),it=new Float32Array(0),xe=new Float32Array(0);function Me(e,t){return e.length>=t?e:new Float32Array(Math.max(t,e.length*2))}function ko(e){return(e*2654435761>>>0&2147483647)/2147483648}function Do(e){return Math.min(5e3,Math.max(200,e*3))}function Uo(e){let t=e.renderZoom,o=e.W,n=e.H,s=e.currentLevel===se,r=e.selectedIds,i=r.size>0,a=e.hoveredId,l=Math.sqrt(o*o+n*n),c=l*1.2,h=c*c,f=l*.25,d=f*f,u=c-f,m,p,g,_,w,A,M;if(s)m=e.edges,p=e.nodes.length,g=E=>e.nodeIndexFull[E],_=E=>E.src,w=E=>E.dst,A=()=>1,M=E=>E;else{let E=e.getLevel(e.currentLevel);if(!E._snByBid){E._snByBid=new Map;for(let H of E.supernodes)E._snByBid.set(H.bid,H)}let F=E._snByBid;m=E.snEdges,p=E.supernodes.length,g=H=>F.get(H),_=H=>H.a,w=H=>H.b,A=H=>H.weight,M=H=>H}let y=Do(p),x=m.length>y?y/m.length:1;nt=Me(nt,Math.min(m.length,y)*8);let v=nt,S=0,b=0,B=s?100/255:124/255,C=s?100/255:106/255,R=s?140/255:247/255,P=s?.25:.4;for(let E=0;E<m.length;E++){let F=m[E],H=g(_(F)),G=g(w(F));if(!H||!G)continue;let N=H.x*t+e.pan.x,Z=H.y*t+e.pan.y,J=G.x*t+e.pan.x,W=G.y*t+e.pan.y,I=N-J,U=Z-W,O=I*I+U*U;if(O>h||x<1&&ko(E)>x*(2-O/h))continue;if(++b>y)break;let k=O<=d?1:Math.max(0,1-(Math.sqrt(O)-f)/u),Q=A(F),X=s?P*k:Math.min(P,.05+Q*.05)*k;if(X<.01)continue;let L=S*8;v[L]=N,v[L+1]=Z,v[L+2]=J,v[L+3]=W,v[L+4]=B,v[L+5]=C,v[L+6]=R,v[L+7]=X,S++}if(i||a!==null){st=Me(st,m.length*8);let E=st,F=0;for(let H=0;H<m.length;H++){let G=m[H],N=_(G),Z=w(G),J=r.has(N)||N===a,W=r.has(Z)||Z===a;if(!J&&!W)continue;let I=g(N),U=g(Z);if(!I||!U)continue;let O=I.x*t+e.pan.x,k=I.y*t+e.pan.y,Q=U.x*t+e.pan.x,X=U.y*t+e.pan.y,L=r.has(N)||r.has(Z)?.3:.15,V=F*8;E[V]=O,E[V+1]=k,E[V+2]=Q,E[V+3]=X,E[V+4]=180/255,E[V+5]=180/255,E[V+6]=220/255,E[V+7]=L,F++}return{normalEdges:v.subarray(0,S*8),normalCount:S,hiliteEdges:E.subarray(0,F*8),hiliteCount:F}}return{normalEdges:v.subarray(0,S*8),normalCount:S,hiliteEdges:new Float32Array(0),hiliteCount:0}}function No(e){let t=e.renderZoom,o=e.W,n=e.H,s=e.currentLevel===se,r=e.selectedIds,i=e.hoveredId,a,l,c,h,f;if(s)a=e.nodes,l=Math.min(o,n)*t/256,c=v=>e._nodeColor(v),h=v=>v.id,f=v=>e.sizeBy==="edges"?v.degree:1;else{a=e.getLevel(e.currentLevel).supernodes;let S=1<<ne[e.currentLevel];l=Math.min(o,n)*t/S,c=b=>b.cachedColor,h=b=>b.bid,f=b=>e.sizeBy==="edges"?b.totalDegree:b.members.length}let d=s?Math.max(1,Math.min(l*.4,20)):Math.max(1.5,Math.min(l*.42,40)),u=s?1:1.5,m=s?1:1.2,p=e.pan.x+"|"+e.pan.y+"|"+t+"|"+e.sizeBy+"|"+e.sizeLog+"|"+e.currentLevel;if(e._glVisKey!==p){let v=0,S=1,b=l*.5;for(let B=0;B<a.length;B++){let C=a[B],R=C.x*t+e.pan.x,P=C.y*t+e.pan.y;if(R>=-b&&R<=o+b&&P>=-b&&P<=n+b){v++;let E=Ae(f(C),e);E>S&&(S=E)}}e._glVisKey=p,e._glVisCount=v,e._glMaxSize=S}let g=e._glVisCount,_=e._glMaxSize;rt=Me(rt,a.length*11);let w=rt,A=r.size+(i!==null?1:0);it=Me(it,Math.max(1,A)*11);let M=it,y=0,x=0;for(let v=0;v<a.length;v++){let S=a[v],b=S.x*t+e.pan.x,B=S.y*t+e.pan.y;if(b<-d||b>o+d||B<-d||B>n+d)continue;let C=f(S),R=Ae(C,e),P=Math.max(u,Math.min(d,u+Math.sqrt(R)*m)),E=c(S),F=at(E),H=h(S),G=r.has(H),N=i===H,Z=g>50?.3+.7*Math.sqrt(R/_):1,J,W;s?(J=G?1:N?.8:187/255,W=G?1:0):(J=G?1:N?.8:Z*153/255,W=G||N?1:Z);let I=y*11;if(w[I]=b,w[I+1]=B,w[I+2]=P,w[I+3]=F[0],w[I+4]=F[1],w[I+5]=F[2],w[I+6]=J,w[I+7]=G?1:F[0],w[I+8]=G?1:F[1],w[I+9]=G?1:F[2],w[I+10]=W,y++,G||N){let U=P*(s?3:2.5),O=x*11;M[O]=b,M[O+1]=B,M[O+2]=U,M[O+3]=F[0],M[O+4]=F[1],M[O+5]=F[2],M[O+6]=G?.27:.2,M[O+7]=0,M[O+8]=0,M[O+9]=0,M[O+10]=0,x++}}return{circles:w.subarray(0,y*11),circleCount:y,glows:M.subarray(0,x*11),glowCount:x}}function Vo(e){let t=e.renderZoom,o=e.W,n=e.H,s=e.currentLevel===se,r=s?e.nodes:e.getLevel(e.currentLevel).supernodes,i=4,a=Math.ceil(o/i),l=Math.ceil(n/i),c=Math.max(8,Math.min(40,Math.min(a,l)/8));xe=Me(xe,r.length*11);let h=xe,f=0;for(let d=0;d<r.length;d++){let u=r[d],m=u.x*t+e.pan.x,p=u.y*t+e.pan.y,g=m/i,_=p/i;if(g<-c||g>a+c||_<-c||_>l+c)continue;let w;s?w=Ae(e.sizeBy==="edges"?u.degree+1:1,e):w=Ae(e.sizeBy==="edges"?u.totalDegree+1:u.members.length,e);let A=s?e._nodeColor(u):u.cachedColor,M=at(A),y=f*11;h[y]=g,h[y+1]=_,h[y+2]=c,h[y+3]=M[0],h[y+4]=M[1],h[y+5]=M[2],h[y+6]=w,h[y+7]=0,h[y+8]=0,h[y+9]=0,h[y+10]=0,f++}return{data:h.subarray(0,f*11),count:f,gw:a,gh:l,kernelR:c}}var de=null;function jo(e,t,o,n,s){let r=s*s,i=o*n;(!de||de.length<i)&&(de=new Float32Array(Math.max(i,1))),de.fill(0,0,i);for(let l=0;l<t;l++){let c=l*11,h=e[c],f=e[c+1],d=e[c+6],u=Math.max(0,h-s|0),m=Math.min(o-1,h+s+1|0),p=Math.max(0,f-s|0),g=Math.min(n-1,f+s+1|0);for(let _=p;_<=g;_++){let w=_-f,A=w*w,M=_*o;for(let y=u;y<=m;y++){let x=y-h,v=x*x+A;if(v>r)continue;let S=1-v/r;de[M+y]+=S*S*d}}}let a=0;for(let l=0;l<i;l++)de[l]>a&&(a=de[l]);return a}function qo(e){return e.currentLevel+"|"+e.renderZoom.toFixed(1)+"|"+e.sizeBy+"|"+e.sizeLog+"|"+e.W+"|"+e.H+"|"+(e._blendGen||0)}function Yo(e,t){let o=t.W,n=t.H;if(Go(e,o,n),e._heatFBOBroken)return;let s=e._heatW,r=e._heatH,{data:i,count:a,gw:l,gh:c,kernelR:h}=Vo(t);if(a===0)return;e.bindFramebuffer(e.FRAMEBUFFER,e._heatFBO),e.viewport(0,0,s,r),e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT),e.enable(e.BLEND),e.blendFunc(e.ONE,e.ONE),e.useProgram(e._heatSplatProg),e.uniform2f(e._heatSplatProg.u_resolution,l,c),e.bindVertexArray(e._circleVAO),e.bindBuffer(e.ARRAY_BUFFER,e._instanceVBO),e.bufferData(e.ARRAY_BUFFER,i,e.DYNAMIC_DRAW),e.drawArraysInstanced(e.TRIANGLE_STRIP,0,4,a),e.bindFramebuffer(e.FRAMEBUFFER,null);let f=qo(t);if(f!==e._heatMaxWKey){let m=jo(i,a,l,c,h);e._heatMaxWTarget=m||1,e._heatMaxWKey=f,e._heatMaxWTime=performance.now(),e._heatMaxW===0&&(e._heatMaxW=e._heatMaxWTarget)}let d=performance.now()-e._heatMaxWTime,u=1-Math.exp(-d/200);if(e._heatMaxW+=(e._heatMaxWTarget-e._heatMaxW)*u,e._heatMaxWTime=performance.now(),e._heatMaxW<.001){e.viewport(0,0,o,n);return}e.viewport(0,0,o,n),e.blendFunc(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA),e.useProgram(e._heatResolveProg),e.uniform1i(e._heatResolveProg.u_density,0),e.uniform1f(e._heatResolveProg.u_maxW,e._heatMaxW),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,e._heatTex),e.bindVertexArray(e._heatResolveVAO),e.drawArrays(e.TRIANGLE_STRIP,0,4),e.disable(e.BLEND),Math.abs(e._heatMaxW-e._heatMaxWTarget)>e._heatMaxWTarget*.01&&t.render()}function Zo(e){let t=e.renderZoom,o=e.W,n=e.H,s=e.currentLevel===se,r=s?e.nodes:e.getLevel(e.currentLevel).supernodes;xe=Me(xe,r.length*11);let i=xe,a=0;for(let l=0;l<r.length;l++){let c=r[l],h=c.x*t+e.pan.x,f=c.y*t+e.pan.y,d=s?200:400;if(h<-d||h>o+d||f<-d||f>n+d)continue;let u;s?u=Ae(e.sizeBy==="edges"?c.degree+1:1,e):u=Ae(e.sizeBy==="edges"?c.totalDegree+1:c.members.length,e);let m=Math.max(50,Math.min(d,50+Math.sqrt(u)*25)),p=s?e._nodeColor(c):c.cachedColor,g=at(p),_=a*11;i[_]=h,i[_+1]=f,i[_+2]=m,i[_+3]=g[0],i[_+4]=g[1],i[_+5]=g[2],i[_+6]=.15,i[_+7]=0,i[_+8]=0,i[_+9]=0,i[_+10]=0,a++}return{data:i.subarray(0,a*11),count:a}}function Ko(e,t){let o=t.W,n=t.H,{data:s,count:r}=Zo(t);if(r===0)return;e.enable(e.BLEND),e.blendFunc(e.SRC_ALPHA,e.ONE);let i=e._circleProgram._glow;e.useProgram(i),e.uniform2f(i.u_resolution,o,n),e.bindVertexArray(e._circleVAO),e.bindBuffer(e.ARRAY_BUFFER,e._instanceVBO),e.bufferData(e.ARRAY_BUFFER,s,e.DYNAMIC_DRAW),e.drawArraysInstanced(e.TRIANGLE_STRIP,0,4,r),e.blendFunc(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA),e.disable(e.BLEND)}function Rt(e,t){let o=t.W,n=t.H;if(o<=0||n<=0)return;e.viewport(0,0,o,n),e._clearR!==void 0?e.clearColor(e._clearR,e._clearG,e._clearB,1):e.clearColor(10/255,10/255,15/255,1),e.clear(e.COLOR_BUFFER_BIT),e.enable(e.BLEND),e.blendFunc(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA);let s=40*t.renderZoom;if(s>=4&&(e.useProgram(e._gridProgram),e.uniform2f(e._gridProgram.u_resolution,o,n),e.uniform1f(e._gridProgram.u_gridSize,s),e.uniform2f(e._gridProgram.u_pan,t.pan.x%s,t.pan.y%s),e.bindVertexArray(e._heatResolveVAO),e.drawArrays(e.TRIANGLE_STRIP,0,4)),!t.nodes||t.nodes.length===0){e.disable(e.BLEND);return}let r=t.edgeMode!=="none"?Uo(t):null,i=t.edgeMode==="curves",a=i?e._edgeCurveProgram:e._edgeLineProgram,l=i?e._edgeCurveVAO:e._edgeLineVAO,c=i?(e._curveSegCount+1)*2:4;r&&r.normalCount>0&&(e.useProgram(a),e.uniform2f(a.u_resolution,o,n),e.uniform1f(a.u_width,1),e.bindVertexArray(l),e.bindBuffer(e.ARRAY_BUFFER,e._instanceVBO),e.bufferData(e.ARRAY_BUFFER,r.normalEdges,e.DYNAMIC_DRAW),e.drawArraysInstanced(e.TRIANGLE_STRIP,0,c,r.normalCount)),t.heatmapMode==="density"?(Yo(e,t),e.enable(e.BLEND),e.blendFunc(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA)):t.heatmapMode==="splat"&&(Ko(e,t),e.enable(e.BLEND),e.blendFunc(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA)),r&&r.hiliteCount>0&&(e.useProgram(a),e.uniform2f(a.u_resolution,o,n),e.uniform1f(a.u_width,2),e.bindVertexArray(l),e.bindBuffer(e.ARRAY_BUFFER,e._instanceVBO),e.bufferData(e.ARRAY_BUFFER,r.hiliteEdges,e.DYNAMIC_DRAW),e.drawArraysInstanced(e.TRIANGLE_STRIP,0,c,r.hiliteCount));let{circles:h,circleCount:f,glows:d,glowCount:u}=No(t);if(f>0){if(u>0){let m=e._circleProgram._glow;e.useProgram(m),e.uniform2f(m.u_resolution,o,n),e.bindVertexArray(e._circleVAO),e.bindBuffer(e.ARRAY_BUFFER,e._instanceVBO),e.bufferData(e.ARRAY_BUFFER,d,e.DYNAMIC_DRAW),e.drawArraysInstanced(e.TRIANGLE_STRIP,0,4,u)}e.useProgram(e._circleProgram),e.uniform2f(e._circleProgram.u_resolution,o,n),e.bindVertexArray(e._circleVAO),e.bindBuffer(e.ARRAY_BUFFER,e._instanceVBO),e.bufferData(e.ARRAY_BUFFER,h,e.DYNAMIC_DRAW),e.drawArraysInstanced(e.TRIANGLE_STRIP,0,4,f)}e.disable(e.BLEND),e.bindVertexArray(null)}var Pt={dark:{grid:"rgba(60,60,100,0.6)",labelBright:"#fff",labelHover:"rgba(230,230,255,0.95)",labelNeighbor:"rgba(210,210,245,0.8)",labelDim:"rgba(220,220,255,0.85)",labelRawDim:"rgba(200,200,220,0.75)",countFill:"#ffffffcc",shadowColor:"rgba(0,0,0,0.9)",shadowNeighbor:"rgba(0,0,0,0.85)",legendBg:"rgba(10, 10, 15, 0.75)",legendText:"#c8c8d8",legendOverflow:"#8888a0",resetBg:"rgba(10, 10, 15, 0.65)",resetText:"#8888a0",fpsFill:"rgba(200,200,220,0.6)"},light:{grid:"rgba(100,100,140,0.25)",labelBright:"#111",labelHover:"rgba(30,30,60,0.9)",labelNeighbor:"rgba(40,40,80,0.75)",labelDim:"rgba(50,50,80,0.8)",labelRawDim:"rgba(60,60,90,0.7)",countFill:"rgba(20,20,40,0.85)",shadowColor:"rgba(255,255,255,0.9)",shadowNeighbor:"rgba(255,255,255,0.85)",legendBg:"rgba(255, 255, 255, 0.85)",legendText:"#333340",legendOverflow:"#6a6a80",resetBg:"rgba(255, 255, 255, 0.75)",resetText:"#6a6a80",fpsFill:"rgba(60,60,80,0.6)"}};function oe(e){return e._lightMode?Pt.light:Pt.dark}function Ft(e){return Math.min(5e3,Math.max(200,e*3))}var ct={};function Ht(e){if(ct[e])return ct[e];let t=parseInt(e.slice(1,3),16),o=parseInt(e.slice(3,5),16),n=parseInt(e.slice(5,7),16),s={r:t,g:o,b:n};return ct[e]=s,s}var lt={};function Se(e,t){let o=t?-e:e;if(lt[o])return lt[o];let n=t?`bold ${e}px JetBrains Mono`:`${e}px JetBrains Mono`;return lt[o]=n,n}var Ot=new Array(256);for(let e=0;e<256;e++)Ot[e]=e.toString(16).padStart(2,"0");var ut={};function Ie(e,t,o,n){let s=(e<<24|t<<16|o<<8|n*255|0)>>>0;if(ut[s])return ut[s];let r=`rgba(${e},${t},${o},${n})`;return ut[s]=r,r}function Gt(e){return(e*2654435761>>>0&2147483647)/2147483648}function ge(e,t){return t.sizeLog?Math.log2(e+1):e}var Ne="curves";function ht(e){Ne=e}function Ve(e,t,o,n,s){if(Ne==="lines"){e.moveTo(t,o),e.lineTo(n,s);return}let r=n-t,i=s-o,a=Math.sqrt(r*r+i*i);if(a<1){e.moveTo(t,o),e.lineTo(n,s);return}let l=-i/a,c=r/a,h=t+r*.3+l*a*.15,f=o+i*.3+c*a*.15,d=t+r*.7+l*a*.05,u=o+i*.7+c*a*.05;e.moveTo(t,o),e.bezierCurveTo(h,f,d,u,n,s)}function Wt(e,t,o){return{x:t*e.renderZoom+e.pan.x,y:o*e.renderZoom+e.pan.y}}function kt(e,t,o){return{x:(t-e.pan.x)/e.renderZoom,y:(o-e.pan.y)/e.renderZoom}}function Dt(e){let t=e.currentLevel===se,o=t?e.nodes:e.getLevel(e.currentLevel).supernodes;if(o.length===0)return;let n=1/0,s=-1/0,r=1/0,i=-1/0;for(let p=0;p<o.length;p++){let g=o[p],_=g.ax!==void 0?g.ax:g.px,w=g.ay!==void 0?g.ay:g.py;_<n&&(n=_),_>s&&(s=_),w<r&&(r=w),w>i&&(i=w)}n<-3&&(n=-3),s>3&&(s=3),r<-3&&(r=-3),i>3&&(i=3);let a=s-n||1,l=i-r||1,c=Math.max(40,Math.min(100,Math.min(e.W,e.H)*.08)),h=e.W-c*2,f=e.H-c*2,d=Math.min(h/a,f/l),u=c+(h-a*d)/2,m=c+(f-l*d)/2;if(e._layoutScale=d,e._layoutOffX=u,e._layoutOffY=m,e._layoutMinX=n,e._layoutMinY=r,t)for(let p=0;p<e.nodes.length;p++){let g=e.nodes[p],_=Math.max(n,Math.min(s,g.px)),w=Math.max(r,Math.min(i,g.py));g.x=u+(_-n)*d,g.y=m+(w-r)*d}else{let p=e.getLevel(e.currentLevel).supernodes;for(let g=0;g<p.length;g++){let _=p[g],w=Math.max(n,Math.min(s,_.ax)),A=Math.max(r,Math.min(i,_.ay));_.x=u+(w-n)*d,_.y=m+(A-r)*d}}}function je(e){let t=e.ctx,o=e.W,n=e.H;t.clearRect(0,0,o,n);let s=!!e._gl,i=e.currentLevel===se?$o:Xo;if(!s){t.strokeStyle=oe(e).grid,t.lineWidth=.5;let a=40*e.renderZoom;if(a>=4){let c=e.pan.x%a,h=e.pan.y%a;t.beginPath();for(let f=c;f<o;f+=a)t.moveTo(f,0),t.lineTo(f,n);for(let f=h;f<n;f+=a)t.moveTo(0,f),t.lineTo(o,f);t.stroke()}ht(e.edgeMode),e.edgeMode!=="none"&&i(e,"edges"),e.heatmapMode==="splat"?Qo(e):e.heatmapMode==="density"&&en(e);let l=Ne;Ne==="none"&&ht("lines"),i(e,"hilite"),ht(l),i(e,"circles")}i(e,"labels"),e.showLegend&&tn(e),e.showResetBtn&&on(e)}function Xo(e,t){let o=e.ctx,n=e.getLevel(e.currentLevel),{supernodes:s,snEdges:r}=n;if(!n._snByBid){n._snByBid=new Map;for(let y of s)n._snByBid.set(y.bid,y)}let i=n._snByBid,a=Math.sqrt(e.W*e.W+e.H*e.H),l=a*1.2,c=l*l,h=a*.25,f=l-h,d=e.renderZoom,u=e.selectedIds,m=u.size>0,p=e.hoveredId;if(t==="edges"){let y=Ft(s.length),x=r.length>y?y/r.length:1,v=0,S=10,b=new Array(S);for(let C=0;C<S;C++)b[C]=[];let B=h*h;for(let C=0;C<r.length;C++){let R=r[C],P=i.get(R.a),E=i.get(R.b);if(!P||!E)continue;let F=P.x*d+e.pan.x,H=P.y*d+e.pan.y,G=E.x*d+e.pan.x,N=E.y*d+e.pan.y,Z=F-G,J=H-N,W=Z*Z+J*J;if(W>c||x<1&&Gt(C)>x*(2-W/c))continue;if(++v>y)break;let I=W<=B?1:Math.max(0,1-(Math.sqrt(W)-h)/f),U=Math.min(.4,.05+R.weight*.05)*I;if(U<.01)continue;let O=Math.min(S-1,U/.4*S|0);b[O].push(F,H,G,N)}for(let C=0;C<S;C++){let R=b[C];if(R.length===0)continue;let P=((C+.5)/S*40|0)/100;o.strokeStyle=Ie(124,106,247,P),o.lineWidth=1,o.beginPath();for(let E=0;E<R.length;E+=4)Ve(o,R[E],R[E+1],R[E+2],R[E+3]);o.stroke()}return}let g=1<<ne[e.currentLevel],_=Math.min(e.W,e.H)*d/g;if(t==="hilite"){if(m||p!==null)for(let y=0;y<r.length;y++){let x=r[y],v=u.has(x.a)||x.a===p,S=u.has(x.b)||x.b===p;if(!v&&!S)continue;let b=i.get(x.a),B=i.get(x.b);if(!b||!B)continue;let C=b.x*d+e.pan.x,R=b.y*d+e.pan.y,P=B.x*d+e.pan.x,E=B.y*d+e.pan.y;o.strokeStyle=u.has(x.a)||u.has(x.b)?"rgba(180,180,220,0.3)":"rgba(180,180,220,0.15)",o.lineWidth=Math.min(4,1+x.weight*.4),o.beginPath(),Ve(o,C,R,P,E),o.stroke()}return}let w=e.pan.x+"|"+e.pan.y+"|"+d+"|"+e.sizeBy+"|"+e.sizeLog;if(n._visKey!==w){let y=0,x=1,v=_*.5;for(let S=0;S<s.length;S++){let b=s[S],B=b.x*d+e.pan.x,C=b.y*d+e.pan.y;if(B>=-v&&B<=e.W+v&&C>=-v&&C<=e.H+v){y++;let R=ge(e.sizeBy==="edges"?b.totalDegree:b.members.length,e);R>x&&(x=R)}}n._visKey=w,n._visibleCount=y,n._maxSizeVal=x}let A=n._visibleCount,M=n._maxSizeVal;for(let y=0;y<s.length;y++){let x=s[y],v=x.x*d+e.pan.x,S=x.y*d+e.pan.y,b=Math.max(1.5,Math.min(_*.42,40));if(v<-b||v>e.W+b||S<-b||S>e.H+b)continue;let B=e.sizeBy==="edges"?x.totalDegree:x.members.length,C=ge(B,e),R=Math.max(1.5,Math.min(b,1.5+Math.sqrt(C)*1.2)),P=x.cachedColor,E=u.has(x.bid),F=p===x.bid,H=A>50?.3+.7*Math.sqrt(C/M):1;if(t==="circles"){if(E||F){let G=o.createRadialGradient(v,S,0,v,S,R*2.5);G.addColorStop(0,P+"44"),G.addColorStop(1,P+"00"),o.fillStyle=G,o.beginPath(),o.arc(v,S,R*2.5,0,Math.PI*2),o.fill()}o.fillStyle=P+(E?"ff":F?"cc":Ot[Math.round(H*153)]),o.beginPath(),o.arc(v,S,R,0,Math.PI*2),o.fill(),o.strokeStyle=E?"#fff":P,o.lineWidth=E?2:1,o.globalAlpha=E||F?1:H,o.stroke(),o.globalAlpha=1}if(t==="labels"){if(!n._hlNeighbors||n._hlKey!==""+[...u]+"|"+p){let W=Math.max(5,Math.min(20,Math.floor(Math.min(e.W,e.H)/40))),I=[];if(m||p!==null)for(let O=0;O<r.length;O++){let k=r[O];(u.has(k.a)||k.a===p)&&I.push({id:k.b,w:k.weight}),(u.has(k.b)||k.b===p)&&I.push({id:k.a,w:k.weight})}I.sort((O,k)=>k.w-O.w);let U=new Set;for(let O=0;O<Math.min(I.length,W);O++)U.add(I[O].id);n._hlNeighbors=U,n._hlKey=""+[...u]+"|"+p}let N=n._hlNeighbors.has(x.bid)&&H>.5;if((E||F)&&_>=10&&R>=3){let W=Math.max(7,Math.min(13,R*1))|0;o.fillStyle=oe(e).countFill,o.font=Se(W,!0),o.textAlign="center",o.textBaseline="middle",o.fillText(B,v,S)}if(E||F||N||A<=50&&_>=20||A<=150&&H>.7&&_>=20){let W=x.cachedLabel,I=W.split(" \xB7 "),U=I.length>1&&e.labelProps.has("label");if(E||F){let O=Math.max(11,Math.min(12,_*.18))|0;o.font=Se(O,!0),o.textAlign="center",o.shadowColor=oe(e).shadowColor,o.shadowBlur=10,o.fillStyle=E?oe(e).labelBright:oe(e).labelHover,U?(o.textBaseline="bottom",o.fillText(I[0],v,S-R-3),o.textBaseline="top",o.fillText(I.slice(1).join(" \xB7 "),v,S+R+3)):(o.textBaseline="bottom",o.fillText(W,v,S-R-3)),o.shadowBlur=0}else if(N){let O=Math.max(10,Math.min(12,_*.18))|0,k=20;if(o.font=Se(O,!1),o.textAlign="center",o.shadowColor=oe(e).shadowNeighbor,o.shadowBlur=10,o.fillStyle=oe(e).labelNeighbor,U){let Q=I[0].length>k?I[0].slice(0,k-1)+"\u2026":I[0];o.textBaseline="bottom",o.fillText(Q,v,S-R-3);let X=I.slice(1).join(" \xB7 "),L=X.length>k?X.slice(0,k-1)+"\u2026":X;o.textBaseline="top",o.fillText(L,v,S+R+3)}else{let Q=W.length>k?W.slice(0,k-1)+"\u2026":W;o.textBaseline="bottom",o.fillText(Q,v,S-R-3)}o.shadowBlur=0}else{let O=Math.max(10,Math.min(13,_*.18))|0,k=O*.6,Q=Math.max(3,_/k|0);if(o.fillStyle=oe(e).labelDim,o.font=Se(O,!1),o.textAlign="center",U){let X=I[0].length>Q?I[0].slice(0,Q-1)+"\u2026":I[0];o.textBaseline="bottom",o.fillText(X,v,S-R-3);let L=I.slice(1).join(" \xB7 "),V=L.length>Q?L.slice(0,Q-1)+"\u2026":L;o.textBaseline="top",o.fillText(V,v,S+R+3)}else{let X=W.length>Q?W.slice(0,Q-1)+"\u2026":W;o.textBaseline="bottom",o.fillText(X,v,S-R-3)}}}}}}function $o(e,t){let o=e.ctx,n=e.renderZoom,s=Math.min(e.W,e.H)*n/256,r=Math.sqrt(e.W*e.W+e.H*e.H),i=r*1.2,a=i*i,l=r*.25,c=i-l,h=e.selectedIds,f=h.size>0,d=e.hoveredId;if(t==="edges"){let u=Ft(e.nodes.length),m=e.edges.length>u?u/e.edges.length:1,p=0,g=10,_=new Array(g);for(let A=0;A<g;A++)_[A]=[];let w=l*l;for(let A=0;A<e.edges.length;A++){let M=e.edges[A],y=e.nodeIndexFull[M.src],x=e.nodeIndexFull[M.dst];if(!y||!x)continue;let v=y.x*n+e.pan.x,S=y.y*n+e.pan.y,b=x.x*n+e.pan.x,B=x.y*n+e.pan.y,C=v-b,R=S-B,P=C*C+R*R;if(P>a||m<1&&Gt(A)>m*(2-P/a))continue;if(++p>u)break;let F=.25*(P<=w?1:Math.max(0,1-(Math.sqrt(P)-l)/c));if(F<.01)continue;let H=Math.min(g-1,F/.25*g|0);_[H].push(v,S,b,B)}o.lineWidth=.8;for(let A=0;A<g;A++){let M=_[A];if(M.length===0)continue;let y=((A+.5)/g*25|0)/100;o.strokeStyle=Ie(100,100,140,y),o.beginPath();for(let x=0;x<M.length;x+=4)Ve(o,M[x],M[x+1],M[x+2],M[x+3]);o.stroke()}return}if(t==="hilite"){if(f||d!==null)for(let u=0;u<e.edges.length;u++){let m=e.edges[u],p=h.has(m.src)||m.src===d,g=h.has(m.dst)||m.dst===d;if(!p&&!g)continue;let _=e.nodeIndexFull[m.src],w=e.nodeIndexFull[m.dst];if(!_||!w)continue;let A=_.x*n+e.pan.x,M=_.y*n+e.pan.y,y=w.x*n+e.pan.x,x=w.y*n+e.pan.y;o.strokeStyle=h.has(m.src)||h.has(m.dst)?"rgba(180,180,220,0.3)":"rgba(180,180,220,0.15)",o.lineWidth=h.has(m.src)||h.has(m.dst)?1.5:1,o.beginPath(),Ve(o,A,M,y,x),o.stroke()}return}for(let u=0;u<e.nodes.length;u++){let m=e.nodes[u],p=m.x*n+e.pan.x,g=m.y*n+e.pan.y,_=Math.max(1,Math.min(s*.4,20));if(p<-_||p>e.W+_||g<-_||g>e.H+_)continue;let w=ge(e.sizeBy==="edges"?m.degree:1,e),A=Math.max(1,Math.min(_,1+Math.sqrt(w)*1)),M=e._nodeColor(m),y=h.has(m.id),x=d===m.id;if(t==="circles"){if(y||x){let v=o.createRadialGradient(p,g,0,p,g,A*3);v.addColorStop(0,M+"66"),v.addColorStop(1,M+"00"),o.fillStyle=v,o.beginPath(),o.arc(p,g,A*3,0,Math.PI*2),o.fill()}o.fillStyle=M+(y?"ff":"bb"),o.beginPath(),o.arc(p,g,A,0,Math.PI*2),o.fill(),y&&(o.strokeStyle="#fff",o.lineWidth=1.5,o.stroke())}if(t==="labels"){if(!e._rawHlNeighbors||e._rawHlKey!==""+[...h]+"|"+d){let b=Math.max(5,Math.min(20,Math.floor(Math.min(e.W,e.H)/40))),B={};if(f||d!==null)for(let P=0;P<e.edges.length;P++){let E=e.edges[P];(h.has(E.src)||E.src===d)&&(B[E.dst]=(B[E.dst]||0)+1),(h.has(E.dst)||E.dst===d)&&(B[E.src]=(B[E.src]||0)+1)}let C=Object.keys(B).sort((P,E)=>B[E]-B[P]),R=new Set(C.slice(0,b));e._rawHlNeighbors=R,e._rawHlKey=""+[...h]+"|"+d}let S=e._rawHlNeighbors.has(m.id)&&m.degree>=3;if(y||x||S||s>=14){let b=e._nodeLabel(m);if(y||x){let B=Math.max(11,Math.min(12,s*.22))|0;o.fillStyle=y?"#fff":"rgba(230,230,255,0.95)",o.font=Se(B,!0),o.textAlign="left",o.textBaseline="middle",o.fillText(b,p+A+3,g)}else{let B=Math.max(10,Math.min(13,s*.22))|0,C=B*.6,R=Math.max(4,s*.8/C|0),P=b.length>R?b.slice(0,R-1)+"\u2026":b;o.fillStyle=oe(e).labelRawDim,o.font=Se(B,!1),o.textAlign="left",o.textBaseline="middle",o.fillText(P,p+A+3,g)}}}}}function Qo(e){let t=e.ctx,o=e.W,n=e.H,s=e.renderZoom,r=e.currentLevel===se,i=r?e.nodes:e.getLevel(e.currentLevel).supernodes;t.save(),t.globalCompositeOperation="lighter",t.globalAlpha=.6;for(let a=0;a<i.length;a++){let l=i[a],c=l.x*s+e.pan.x,h=l.y*s+e.pan.y,f=r?200:400;if(c<-f||c>o+f||h<-f||h>n+f)continue;let d;r?d=ge(e.sizeBy==="edges"?l.degree+1:1,e):d=ge(e.sizeBy==="edges"?l.totalDegree+1:l.members.length,e);let u=Math.max(50,Math.min(f,50+Math.sqrt(d)*25)),m=r?e._nodeColor(l):l.cachedColor,p=Ht(m),g=t.createRadialGradient(c,h,0,c,h,u);g.addColorStop(0,Ie(p.r,p.g,p.b,.25)),g.addColorStop(.5,Ie(p.r,p.g,p.b,.08)),g.addColorStop(1,Ie(p.r,p.g,p.b,0)),t.fillStyle=g,t.beginPath(),t.arc(c,h,u,0,Math.PI*2),t.fill()}t.restore()}var Bt=0,Ct=0,We=null,ke=null,De=null,we=null,ft=null,dt=null,pe=0,Ue=0,Tt="",pt=0,Jo=0,It=0;function zo(e){return e._densityId||(e._densityId=++Jo),e._densityId+"|"+e.currentLevel+"|"+e.renderZoom.toFixed(1)+"|"+e.sizeBy+"|"+e.sizeLog+"|"+e.W+"|"+e.H}function en(e){let t=e.W,o=e.H,n=e.renderZoom,s=e.currentLevel===se,r=s?e.nodes:e.getLevel(e.currentLevel).supernodes,i=4,a=Math.ceil(t/i),l=Math.ceil(o/i),c=a*l;(a!==Bt||l!==Ct)&&(Bt=a,Ct=l,We=new Float32Array(c),ke=new Float32Array(c),De=new Float32Array(c),we=new Float32Array(c),ft=new ImageData(a,l),dt=new OffscreenCanvas(a,l)),We.fill(0),ke.fill(0),De.fill(0),we.fill(0);let h=Math.max(8,Math.min(40,Math.min(a,l)/8)),f=h*h,d=zo(e),u=d!==Tt;for(let A=0;A<r.length;A++){let M=r[A],y=(M.x*n+e.pan.x)/i,x=(M.y*n+e.pan.y)/i;if(y<-h||y>a+h||x<-h||x>l+h)continue;let v;s?v=ge(e.sizeBy==="edges"?M.degree+1:1,e):v=ge(e.sizeBy==="edges"?M.totalDegree+1:M.members.length,e);let S=s?e._nodeColor(M):M.cachedColor,b=Ht(S),B=Math.max(0,y-h|0),C=Math.min(a-1,y+h+1|0),R=Math.max(0,x-h|0),P=Math.min(l-1,x+h+1|0);for(let E=R;E<=P;E++){let F=E-x,H=F*F,G=E*a;for(let N=B;N<=C;N++){let Z=N-y,J=Z*Z+H;if(J>f)continue;let W=1-J/f,I=W*W*v,U=G+N;We[U]+=b.r*I,ke[U]+=b.g*I,De[U]+=b.b*I,we[U]+=I}}}if(u){let A=0;for(let y=0;y<c;y++)we[y]>A&&(A=we[y]);Ue=A,Tt=d,pt=performance.now();let M=e._densityId!==It;It=e._densityId,(pe===0||M)&&(pe=A)}let m=performance.now()-pt,p=1-Math.exp(-m/200);if(pe+=(Ue-pe)*p,pt=performance.now(),pe<.001)return;let g=ft.data,_=1/(pe*.3);for(let A=0;A<c;A++){let M=we[A];if(M<.001){g[A*4+3]=0;continue}let y=Math.min(1,M*_),x=y/M,v=A*4;g[v]=Math.min(255,We[A]*x+.5|0),g[v+1]=Math.min(255,ke[A]*x+.5|0),g[v+2]=Math.min(255,De[A]*x+.5|0),g[v+3]=Math.min(255,y*180+.5|0)}dt.getContext("2d").putImageData(ft,0,0),e.ctx.save(),e.ctx.imageSmoothingEnabled=!0,e.ctx.imageSmoothingQuality="high",e.ctx.drawImage(dt,0,0,t,o),e.ctx.restore(),Math.abs(pe-Ue)>Ue*.01&&e.render()}function tn(e){let t=e._cachedColorMap;if(!t)return;let o=Object.entries(t);if(o.length===0)return;let n=e.currentLevel===se,s=n?e.nodes:e.getLevel(e.currentLevel).supernodes,r={};for(let v of s){let S=n?e._nodeColorVal(v):v.cachedColorVal||"";r[S]=(r[S]||0)+1}o.sort((v,S)=>(r[S[0]]||0)-(r[v[0]]||0));let a=o.slice(0,12),l=o.length-a.length,c=e.ctx,h=10,f=4,d=16,u=8,m=90;c.font=`${h}px JetBrains Mono, monospace`;let p=0;for(let[v]of a){let S=c.measureText(v.length>14?v.slice(0,13)+"\u2026":v).width;S>p&&(p=S)}p=Math.min(p,m);let g=a.length+(l>0?1:0),_=f*2+6+p+u*2,w=g*d+u*2,A=8,M=e.showLegend||1,y=M===2||M===3?A:e.W-_-A,x=M===3||M===4?A:e.H-w-A;c.fillStyle=oe(e).legendBg,c.beginPath(),c.roundRect(y,x,_,w,4),c.fill();for(let v=0;v<a.length;v++){let[S,b]=a[v],B=x+u+v*d+d/2;c.fillStyle=b,c.beginPath(),c.arc(y+u+f,B,f,0,Math.PI*2),c.fill(),c.fillStyle=oe(e).legendText,c.textAlign="left",c.textBaseline="middle";let C=S.length>14?S.slice(0,13)+"\u2026":S;c.fillText(C,y+u+f*2+6,B)}if(l>0){let v=x+u+a.length*d+d/2;c.fillStyle=oe(e).legendOverflow,c.textAlign="left",c.textBaseline="middle",c.fillText(`+${l} more`,y+u,v)}}function on(e){let t=e._resetBtnRect();if(!t)return;let o=e.ctx;o.fillStyle=oe(e).resetBg,o.beginPath(),o.roundRect(t.x,t.y,t.w,t.h,4),o.fill(),o.fillStyle=oe(e).resetText,o.font="14px JetBrains Mono, monospace",o.textAlign="center",o.textBaseline="middle",o.fillText("\u21BA",t.x+t.w/2,t.y+t.h/2)}function Ut(e,t,o){let n=e.renderZoom,s=(t-e.pan.x)/n,r=(o-e.pan.y)/n;if(e.currentLevel===se){let i=Math.min(e.W,e.H)*n/256,l=(Math.max(8,Math.min(10,i*.42))+4)/n,c=l*l,h=5,f=ne[h],d=e._layoutScale;if(d&&e.nodes.length>500){let u=(s-e._layoutOffX)/d+e._layoutMinX,m=(r-e._layoutOffY)/d+e._layoutMinY,p=Math.max(0,Math.min(z-1,Math.floor((u+1)/2*z))),g=Math.max(0,Math.min(z-1,Math.floor((m+1)/2*z))),_=be-f,w=p>>_,A=g>>_,M=1<<f,y=e.getLevel(h);if(!y._snByBid){y._snByBid=new Map;for(let x of y.supernodes)y._snByBid.set(x.bid,x)}for(let x=-1;x<=1;x++){let v=A+x;if(!(v<0||v>=M))for(let S=-1;S<=1;S++){let b=w+S;if(b<0||b>=M)continue;let B=b<<f|v,C=y._snByBid.get(B);if(C)for(let R of C.members){let P=R.x-s,E=R.y-r;if(P*P+E*E<c)return{type:"node",item:R}}}}}else for(let u=0;u<e.nodes.length;u++){let m=e.nodes[u],p=m.x-s,g=m.y-r;if(p*p+g*g<c)return{type:"node",item:m}}}else{let i=ne[e.currentLevel],a=1<<i,l=Math.min(e.W,e.H)*n/a,h=(Math.max(6,Math.min(22,l*.42))+6)/n,f=h*h,d=e.getLevel(e.currentLevel),u=e._layoutScale;if(u&&d.supernodes.length>100){if(!d._snByBid){d._snByBid=new Map;for(let y of d.supernodes)d._snByBid.set(y.bid,y)}let m=(s-e._layoutOffX)/u+e._layoutMinX,p=(r-e._layoutOffY)/u+e._layoutMinY,g=Math.max(0,Math.min(z-1,Math.floor((m+1)/2*z))),_=Math.max(0,Math.min(z-1,Math.floor((p+1)/2*z))),w=be-i,A=g>>w,M=_>>w;for(let y=-1;y<=1;y++){let x=M+y;if(!(x<0||x>=a))for(let v=-1;v<=1;v++){let S=A+v;if(S<0||S>=a)continue;let b=d._snByBid.get(S<<i|x);if(!b)continue;let B=b.x-s,C=b.y-r;if(B*B+C*C<f)return{type:"supernode",item:b}}}}else for(let m=0;m<d.supernodes.length;m++){let p=d.supernodes[m],g=p.x-s,_=p.y-r;if(g*g+_*_<f)return{type:"supernode",item:p}}}return null}function nn(e){let t=[],o=[],n=new Set,s=new Map,r=!1,i=0,a=e.length;for(;i<a;){let l=e.indexOf(`
`,i);l===-1&&(l=a);let c=i;for(;c<l&&(e.charCodeAt(c)===32||e.charCodeAt(c)===9||e.charCodeAt(c)===13);)c++;if(i=l+1,c>=l||e.charCodeAt(c)===35)continue;let h=e.indexOf("	",c);if(h<0||h>=l)continue;let f=e.slice(c,h),d=e.indexOf("	",h+1),u=l;u>0&&e.charCodeAt(u-1)===13&&u--;let m=d>=0&&d<l?e.slice(h+1,d):e.slice(h+1,u);if(n.add(f),n.add(m),t.push(f),o.push(m),d>=0&&d<l){let p=e.slice(d+1,u);p&&(r=!0,s.has(f)||s.set(f,new Set),s.has(m)||s.set(m,new Set),s.get(f).add(p),s.get(m).add(p))}}return{edgeFrom:t,edgeTo:o,edgeCount:t.length,edgeTypeMap:r?s:null,nodeIds:n}}function sn(e){let t=new Map,o=[],n=e.split(`
`),s=0;if(n.length>0&&n[0].trim().startsWith("#")){let r=n[0].trim().replace(/^#\s*/,"").split("	");for(let i=3;i<r.length;i++)o.push(r[i].trim().toLowerCase().replace(/\s+/g,"_"));s=1}for(let r=s;r<n.length;r++){let i=n[r].replace(/[\r\n]+$/,"");if(!i||i[0]==="#")continue;let a=i.split("	");if(a.length<2)continue;let l={label:a[1]||a[0],group:a.length>=3?a[2]:"unknown",extraProps:{}};for(let c=3;c<a.length;c++){let h=c-3<o.length?o[c-3]:`prop${c+1}`;l.extraProps[h]=a[c]}t.set(a[0],l)}if(o.length===0)for(let r of t.values()){for(let i of Object.keys(r.extraProps))o.includes(i)||o.push(i);break}return{nodes:t,extraPropNames:o}}function rn(e,t,o){let n=[],s={};for(let u of e.nodeIds){let m=t?t.get(u):null,p=m?m.group:"unknown",g=m?m.label:u,_=e.edgeTypeMap?e.edgeTypeMap.has(u)?[...e.edgeTypeMap.get(u)]:[]:null,w=m?m.extraProps||{}:{},A={id:u,group:p,label:g,degree:0,edgeTypes:_,extraProps:w};s[u]=A,n.push(A)}let r=[],i={};for(let u=0;u<n.length;u++)i[n[u].id]=[];for(let u=0;u<e.edgeCount;u++){let m=e.edgeFrom[u],p=e.edgeTo[u];s[m]&&s[p]&&(r.push({src:m,dst:p}),s[m].degree++,s[p].degree++,i[m].push(p),i[p].push(m))}let a=["group","label","structure","neighbors"];for(let u of o)a.push(u);let l=!!e.edgeTypeMap;l&&a.push("edgetype");let c=new Array(n.length);for(let u=0;u<n.length;u++){let m=i[n[u].id],p=new Array(m.length);for(let g=0;g<m.length;g++)p[g]=s[m[g]].group;c[u]=p}let h=new Set;for(let u=0;u<n.length;u++)h.add(n[u].group);let f=[...h].sort(),d={};for(let u of o){let m=0,p=0,g=1/0,_=-1/0;for(let w=0;w<n.length;w++){let A=n[w].extraProps[u];if(!A||A==="unknown")continue;p++;let M=Number(A);isFinite(M)&&(m++,M<g&&(g=M),M>_&&(_=M))}p>0&&m/p>=.8&&_>g&&(d[u]={min:g,max:_,coarse:5,medium:50,fine:500})}return{nodeArray:n,nodeIndex:s,edges:r,adjList:i,adjGroups:c,groupNames:a,uniqueGroups:f,hasEdgeTypes:l,numericBins:d}}function Nt(e){return e===0?"0":e===1?"1":e<=3?"2-3":e<=7?"4-7":e<=15?"8-15":e<=31?"16-31":"32+"}function Vt(e,t,o,n){let s=e.toLowerCase(),r=-1,i=0;for(let a=0;a<=s.length;a++){let l=a<s.length?s.charCodeAt(a):0;l>=48&&l<=57||l>=97&&l<=122?r<0&&(r=a):(r>=0&&a-r>1&&(o[n+i]="label:"+s.slice(r,a),i++),r=-1)}return i===0&&(o[n]="label:"+t,i=1),n+i}function jt(e,t,o,n,s){if(!t||t==="")return s;let r=Number(t);if(!isFinite(r)||!o)return n[s]=e+":"+t,s+1;let i=o.max-o.min,a=[{prefix:"c",count:o.coarse},{prefix:"m",count:o.medium},{prefix:"f",count:o.fine}];for(let l of a){let c=i/l.count,h=Math.min(l.count-1,Math.floor((r-o.min)/c)),f=o.min+h*c,d=f+c;n[s++]=e+":"+l.prefix+":"+f.toPrecision(3)+"-"+d.toPrecision(3)}return s}function gt(e,t,o,n,s,r){r=r||{};let i={};for(let d=0;d<o.length;d++)i[o[d]]=Le(2001+d,Y);let a=e.length,l=o.length,c=new Float64Array(a*l*2),h={};for(let d=0;d<l;d++)h[o[d]]=d;let f=new Array(200);for(let d=0;d<a;d++){let u=e[d],m=d*l*2;f[0]="group:"+u.group,he(f,1),fe(te,i.group,c,m+h.group*2);let p=Vt(u.label,u.id,f,0);he(f,p),fe(te,i.label,c,m+h.label*2),f[0]="deg:"+Nt(u.degree),f[1]="leaf:"+(u.degree===0),he(f,2),fe(te,i.structure,c,m+h.structure*2);let g=t[d],_=0;if(g.length>0)for(let w=0;w<g.length;w++)f[_++]="ngroup:"+g[w];else f[0]="ngroup:isolated",_=1;if(he(f,_),fe(te,i.neighbors,c,m+h.neighbors*2),n){if(_=0,u.edgeTypes&&u.edgeTypes.length>0)for(let w=0;w<u.edgeTypes.length;w++)f[_++]="etype:"+u.edgeTypes[w];else f[0]="etype:none",_=1;he(f,_),fe(te,i.edgetype,c,m+h.edgetype*2)}for(let w=0;w<s.length;w++){let A=s[w],M=u.extraProps&&u.extraProps[A],y=jt(A,M,r[A],f,0);y>0&&(he(f,y),fe(te,i[A],c,m+h[A]*2))}}return{projBuf:c,groupNames:o}}function qt(e,t){let o=nn(e),n=t?sn(t):null,s=n?n.nodes:null,r=n?n.extraPropNames:[],i=rn(o,s,r),{projBuf:a}=gt(i.nodeArray,i.adjGroups,i.groupNames,i.hasEdgeTypes,r,i.numericBins);return{...i,projBuf:a,extraPropNames:r}}var K=null,an=null,cn=`
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
`;async function mt(){if(K)return!0;if(!navigator.gpu)return console.log("[GPU] navigator.gpu not available"),!1;let e=await navigator.gpu.requestAdapter();if(!e)return console.log("[GPU] No GPU adapter found"),!1;try{let s=e.info||{};console.log("[GPU] Adapter:",s.vendor||"unknown",s.architecture||"",s.device||"")}catch{}K=await e.requestDevice(),console.log("[GPU] Device acquired, maxStorageBuffersPerShaderStage:",K.limits.maxStorageBuffersPerShaderStage),K.pushErrorScope("validation");let t=K.createShaderModule({code:cn}),o=await t.getCompilationInfo();for(let s of o.messages)s.type==="error"&&console.error("WGSL error:",s.message,"line:",s.lineNum);an=K.createComputePipeline({layout:"auto",compute:{module:t,entryPoint:"main"}});let n=await K.popErrorScope();return n?(console.error("Pipeline creation error:",n.message),!1):!0}var ln=`
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
`,Fe=null;async function un(){if(Fe)return;if(!K)throw new Error("GPU not initialized");K.pushErrorScope("validation");let e=K.createShaderModule({code:ln}),t=await e.getCompilationInfo();for(let n of t.messages)n.type==="error"&&console.error("[GPU] Blend WGSL error:",n.message,"line:",n.lineNum);Fe=K.createComputePipeline({layout:"auto",compute:{module:e,entryPoint:"main"}});let o=await K.popErrorScope();o?console.error("[GPU] Blend pipeline error:",o.message):console.log("[GPU] Blend pipeline ready")}async function hn(e,t,o,n,s,r,i){await un();let a=e.length,l=Math.max(0,Math.min(1,n)),c=0;for(let L of t){let V=o[L]||0;V>c&&(c=V)}let h=Math.max(c*$e,Qe),f=0,d={};for(let L of t)d[L]=Math.max(o[L]||0,h),f+=d[L];let u=new Float32Array(a),m=new Float32Array(a);for(let L=0;L<a;L++){let V=e[L],ee=0,T=0;for(let j of t){let D=V.projections[j];D&&(ee+=D[0]*d[j],T+=D[1]*d[j])}u[L]=ee/f,m[L]=T/f}let p={};for(let L=0;L<a;L++)p[e[L].id]=L;let g=new Uint32Array(a+1),_=0;for(let L=0;L<a;L++){g[L]=_;let V=s[e[L].id];if(V)for(let ee of V)p[ee]!==void 0&&_++}g[a]=_;let w=new Uint32Array(_),A=0;for(let L=0;L<a;L++){let V=s[e[L].id];if(V)for(let ee of V){let T=p[ee];T!==void 0&&(w[A++]=T)}}if(l===0||i===0)return{px:u,py:m};let M=(L,V)=>{let ee=Math.max(256,L.byteLength),T=K.createBuffer({size:ee,usage:V,mappedAtCreation:!0});return new Uint8Array(T.getMappedRange()).set(new Uint8Array(L.buffer,L.byteOffset,L.byteLength)),T.unmap(),T},y=GPUBufferUsage.STORAGE,x=GPUBufferUsage.UNIFORM,v=M(u,y),S=M(m,y),b=M(g,y),B=M(w.length>0?w:new Uint32Array(1),y),C=Math.max(256,a*2*4),R=new Float32Array(a*2);for(let L=0;L<a;L++)R[L*2]=u[L],R[L*2+1]=m[L];let P=M(R,y|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST),E=K.createBuffer({size:C,usage:y|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),F=new ArrayBuffer(16);new Float32Array(F,0,1)[0]=l,new Uint32Array(F,4,1)[0]=a;let H=K.createBuffer({size:16,usage:x,mappedAtCreation:!0});new Uint8Array(H.getMappedRange()).set(new Uint8Array(F)),H.unmap();let G=K.createBindGroup({layout:Fe.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:v}},{binding:1,resource:{buffer:S}},{binding:2,resource:{buffer:b}},{binding:3,resource:{buffer:B}},{binding:4,resource:{buffer:P}},{binding:5,resource:{buffer:E}},{binding:6,resource:{buffer:H}}]}),N=K.createBindGroup({layout:Fe.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:v}},{binding:1,resource:{buffer:S}},{binding:2,resource:{buffer:b}},{binding:3,resource:{buffer:B}},{binding:4,resource:{buffer:E}},{binding:5,resource:{buffer:P}},{binding:6,resource:{buffer:H}}]}),Z=Math.ceil(a/64);for(let L=0;L<i;L++){let V=L%2===0?G:N,ee=K.createCommandEncoder(),T=ee.beginComputePass();T.setPipeline(Fe),T.setBindGroup(0,V),T.dispatchWorkgroups(Z),T.end(),K.queue.submit([ee.finish()])}let J=i%2===0?P:E,W=i%2===1?E:P,I=Math.max(256,a*2*4),U=K.createBuffer({size:I,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),O=K.createCommandEncoder();O.copyBufferToBuffer(W,0,U,0,a*2*4),K.queue.submit([O.finish()]),await U.mapAsync(GPUMapMode.READ);let k=new Float32Array(U.getMappedRange()).slice(0,a*2);U.unmap(),v.destroy(),S.destroy(),b.destroy(),B.destroy(),P.destroy(),E.destroy(),H.destroy(),U.destroy();let Q=new Float32Array(a),X=new Float32Array(a);for(let L=0;L<a;L++)Q[L]=k[L*2],X[L]=k[L*2+1];return{px:Q,py:X}}async function Yt(e,t,o,n,s,r,i,a,l){let c=await hn(e,t,o,n,s,r,i);for(let h=0;h<e.length;h++)e[h].px=c.px[h],e[h].py=c.py[h];a==="gaussian"?Pe(e,l||{}):Re(e)}var qe=class{constructor(t,o={}){this.canvas=t,this.ctx=t.getContext("2d"),this.nodes=o.nodes||[],this.edges=o.edges||[],this.nodeIndexFull=o.nodeIndexFull||{},this.adjList=o.adjList||{},this.groupNames=o.groupNames||[],this.propWeights={...o.propWeights},this.propColors=o.propColors||{},this.groupColors=o.groupColors||this.propColors.group||{},this.groupProjections={},this.smoothAlpha=o.smoothAlpha||0,this.maxDegree=1,this.hasEdgeTypes=o.hasEdgeTypes||!1;for(let n=0;n<this.groupNames.length;n++)this.groupProjections[this.groupNames[n]]=Le(2001+n,Y);for(let n of this.nodes)n.degree>this.maxDegree&&(this.maxDegree=n.degree);this.W=0,this.H=0,this.currentLevel=o.initialLevel??3,this.baseLevel=this.currentLevel,this.pan={x:0,y:0},this.zoom=1,this.sizeBy=o.sizeBy||"edges",this.sizeLog=o.sizeLog||!1,this.edgeMode=o.edgeMode||"curves",this.heatmapMode=o.heatmapMode||"off",this.quantMode=o.quantMode||"gaussian",this.showLegend=o.showLegend?1:0,this.showResetBtn=o.showResetBtn||!1,this._progressText=null,this.showFps=o.showFps||!1,this._colorScheme=o.colorScheme||0,this._lightMode=o.lightMode||!1,this._useGPU=!1,this._gl=null,this._glCanvas=null,this._glWrapper=null,this._quantStats={},this._blendGen=0,o.webgl&&this._initWebGL(t),this.labelProps=new Set(o.labelProps||[]),this._initLevel=this.currentLevel,this._initColorScheme=this._colorScheme,this.selectedIds=new Set,this._primarySelectedId=null,this.hoveredId=null,this._onSelect=o.onSelect||null,this._onHover=o.onHover||null,this.levels=new Array(ne.length).fill(null),this._cachedDominant="label",this._cachedLabelProps=["label"],this._cachedColorMap={},this._refreshPropCache(),this.mouseDown=!1,this.mouseMoved=!1,this.mouseStart=null,this.t1=null,this.t2=null,this.touchMoved=!1,this._renderPending=!1,this._edgeBuildRaf=null,this._abortController=new AbortController,this._resizeObserver=null,this._onRender=o.onRender||null,o.skipEvents||this._bindEvents(),this.resize()}get renderZoom(){return Math.max(1,this.zoom*Math.pow(2,this.currentLevel-this.baseLevel))}get selectedId(){return this._primarySelectedId}set selectedId(t){this._primarySelectedId=t,t===null?this.selectedIds.clear():this.selectedIds.has(t)||(this.selectedIds.clear(),this.selectedIds.add(t))}isSelected(t){return this.selectedIds.has(t)}toggleSelection(t){this.selectedIds.has(t)?(this.selectedIds.delete(t),this._primarySelectedId=this.selectedIds.size>0?[...this.selectedIds].pop():null):(this.selectedIds.add(t),this._primarySelectedId=t)}get _dominantProp(){return this._cachedDominant}get _labelProp(){return this._cachedLabelProps[0]}_refreshPropCache(){let t="label",o=0;for(let n of this.groupNames)(this.propWeights[n]||0)>o&&(o=this.propWeights[n],t=n);this._cachedDominant=t,this._cachedLabelProps=this.labelProps.size>0?[...this.labelProps]:[t],this._cachedColorMap=this.propColors[t]||{},this.levels=new Array(ne.length).fill(null),this._edgeBuildRaf&&(cancelAnimationFrame(this._edgeBuildRaf),this._edgeBuildRaf=null)}cycleColorScheme(){this._colorScheme=(this._colorScheme+1)%Ce.length;for(let t of this.groupNames){let o=[...new Set(this.nodes.map(n=>ae(n,t,this.adjList)))].sort();this.propColors[t]=Te(o,this._colorScheme)}this._refreshPropCache(),this.layoutAll(),this.render()}get colorScheme(){return this._colorScheme}set colorScheme(t){this._colorScheme=t%Ce.length;for(let o of this.groupNames){let n=[...new Set(this.nodes.map(s=>ae(s,o,this.adjList)))].sort();this.propColors[o]=Te(n,this._colorScheme)}this._refreshPropCache(),this.layoutAll(),this.render()}get colorSchemeName(){return et[this._colorScheme]}get lightMode(){return this._lightMode}set lightMode(t){if(this._lightMode=!!t,this._gl&&this.canvas){let o=this.canvas.ownerDocument?.documentElement;if(o){let n=getComputedStyle(o).getPropertyValue("--canvas-bg").trim(),s=n&&n.match(/#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);s&&(this._gl._clearR=parseInt(s[1],16)/255,this._gl._clearG=parseInt(s[2],16)/255,this._gl._clearB=parseInt(s[3],16)/255)}}this.render()}_nodeLabel(t){let o=this._cachedLabelProps;if(o.length===1)return ae(t,o[0],this.adjList);let n=[];for(let s of o){let r=ae(t,s,this.adjList);r&&r!=="unknown"&&r!==t.id&&n.push(r)}return n.length>0?n.join(" \xB7 "):t.label||t.id}_supernodeLabel(t){let o=this._cachedLabelProps;if(o.length===1)return Je(t,o[0],this.adjList);let n=[];for(let s of o){let r=Je(t,s,this.adjList);r&&r!=="unknown"&&n.push(r)}return n.length>0?n.join(" \xB7 "):t.repName}_nodeColorVal(t){return ae(t,this._cachedDominant,this.adjList)}_nodeColor(t){return this._cachedColorMap[this._nodeColorVal(t)]||"#888888"}_supernodeColor(t){let o={};for(let n of t.members){let s=this._nodeColorVal(n);o[s]=(o[s]||0)+1}return this._cachedColorMap[_e(o)]||"#888888"}getLevel(t){if(this.levels[t])!this.levels[t]._edgesReady&&!this._edgeBuildRaf&&this._scheduleEdgeBuild(t);else{let o=this._dominantProp,n=this.propColors[o];this.levels[t]=wt(ne[t],this.nodes,s=>ae(s,o,this.adjList),s=>this._nodeLabel(s),s=>n&&n[s]||"#888888"),this.layoutAll(),this._scheduleEdgeBuild(t)}return this.levels[t]}_scheduleEdgeBuild(t){this._edgeBuildRaf&&(cancelAnimationFrame(this._edgeBuildRaf),this._edgeBuildRaf=null);let o=this.levels[t];if(!o||o._edgesReady)return;let n=this.edges,s=this.nodeIndexFull,r=ne[t],i=5e4,a=r<=13,l=67108864,c=new Map,h=0,f=()=>{let d=Math.min(h+i,n.length);for(let u=h;u<d;u++){let m=n[u],p=s[m.src],g=s[m.dst];if(!p||!g)continue;let _=Ge(p.gx,p.gy,r),w=Ge(g.gx,g.gy,r);if(_!==w){let A=_<w?_:w,M=_<w?w:_,y=a?A*l+M:A+","+M;c.set(y,(c.get(y)||0)+1)}}if(h=d,this.levels[t]!==o){this._edgeBuildRaf=null;return}if(h<n.length)this._edgeBuildRaf=requestAnimationFrame(f);else{let u=new Array(c.size),m=0;if(a)for(let[p,g]of c)u[m++]={a:p/l|0,b:p%l,weight:g};else for(let[p,g]of c){let _=p.indexOf(",");u[m++]={a:parseInt(p.slice(0,_),10),b:parseInt(p.slice(_+1),10),weight:g}}o.snEdges=u,o._edgesReady=!0,this._edgeBuildRaf=null,this.render()}};this._edgeBuildRaf=requestAnimationFrame(f)}layoutAll(){Dt(this)}render(){this._renderPending||(this._renderPending=!0,requestAnimationFrame(()=>{this._renderPending=!1;let t=performance.now();this._gl&&Rt(this._gl,this),je(this),this._lastFrameMs=performance.now()-t,this._frameCount=(this._frameCount||0)+1;let o=performance.now();this._fpsTime||(this._fpsTime=o),o-this._fpsTime>=1e3&&(this._fps=this._frameCount,this._frameCount=0,this._fpsTime=o),this.showFps&&this._drawFps(),this._postRender()}))}_drawFps(){let t=this.ctx,o=this._fps||0,n=this._lastFrameMs||0,s=this._gl?"GL":"2D",r=`${o} fps \xB7 ${n.toFixed(1)}ms \xB7 ${s}`;t.font="10px JetBrains Mono",t.fillStyle=this._lightMode?"rgba(60,60,80,0.6)":"rgba(200,200,220,0.6)",t.textAlign="left",t.textBaseline="top",t.fillText(r,6,6)}_postRender(){this._onRender&&this._onRender()}showProgress(t){if(this._progressText=t,je(this),t){let o=this.canvas.getContext("2d"),n=this.W,s=this.H,r=28,i=s/2-r/2;o.fillStyle="rgba(10, 10, 15, 0.8)",o.fillRect(0,i,n,r),o.fillStyle="#c8c8d8",o.font="13px Inter, sans-serif",o.textAlign="center",o.textBaseline="middle",o.fillText(t,n/2,s/2)}}renderNow(){je(this)}worldToScreen(t,o){return Wt(this,t,o)}screenToWorld(t,o){return kt(this,t,o)}hitTest(t,o){return Ut(this,t,o)}resize(){this.W=this.canvas.clientWidth||300,this.H=this.canvas.clientHeight||300,this.canvas.width=this.W,this.canvas.height=this.H,this._glCanvas&&(this._glCanvas.width=this.W,this._glCanvas.height=this.H),this.layoutAll(),this.render()}zoomForLevel(t){this.zoom=1,this.pan={x:0,y:0}}switchLevel(t){let o=this.renderZoom;this.currentLevel=t,this.zoom=o/Math.pow(2,t-this.baseLevel),this.selectedId=null,this.layoutAll(),this.render()}_checkAutoLevel(){let t=this.currentLevel,o=Xe.length-1;if(t<o&&this.zoom>=2){this.zoom/=2,this.currentLevel=t+1,this.layoutAll();return}if(t>0&&this.zoom<.5){this.zoom*=2,this.currentLevel=t-1,this.layoutAll(),this.renderZoom<=1&&(this.pan={x:0,y:0});return}this.currentLevel===0&&this.renderZoom<=1&&(this.pan={x:0,y:0})}get useGPU(){return this._useGPU}set useGPU(t){this._useGPU=!!t}get useWebGL(){return!!this._gl}set useWebGL(t){t&&!this._gl?this._initWebGL(this.canvas):!t&&this._gl&&this._destroyWebGL(),this.resize(),this.render()}_initWebGL(t){let o=t.parentElement;if(!o)return;let n=document.createElement("div"),s=getComputedStyle(t);n.style.cssText=`position:relative;width:${s.width};height:${s.height};min-height:0;overflow:hidden;grid-column:${s.gridColumn};grid-row:${s.gridRow}`,o.insertBefore(n,t),n.appendChild(t),this._glWrapper=n,this._glCanvas=document.createElement("canvas"),this._glCanvas.style.cssText="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none";let r=getComputedStyle(t).backgroundColor;if(r&&r!=="rgba(0, 0, 0, 0)"&&(this._glCanvas.style.background=r,this._origCanvasBg=t.style.background),t.style.position="absolute",t.style.top="0",t.style.left="0",t.style.width="100%",t.style.height="100%",t.style.background="transparent",n.insertBefore(this._glCanvas,t),this._gl=Lt(this._glCanvas),!this._gl){n.parentElement.insertBefore(t,n),n.remove(),t.style.position="",t.style.top="",t.style.left="",t.style.width="",t.style.height="",this._origCanvasBg!==void 0?(t.style.background=this._origCanvasBg,this._origCanvasBg=void 0):t.style.background="",this._glCanvas=null,this._glWrapper=null;return}if(r){let i=r.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);i&&(this._gl._clearR=+i[1]/255,this._gl._clearG=+i[2]/255,this._gl._clearB=+i[3]/255)}console.log("[GL] WebGL2 rendering enabled")}_destroyWebGL(){if(this._glCanvas&&(this._glCanvas.remove(),this._glCanvas=null,this._gl=null),this._glWrapper){let t=this._glWrapper.parentElement;t&&(t.insertBefore(this.canvas,this._glWrapper),this._glWrapper.remove()),this._glWrapper=null,this.canvas.style.position="",this.canvas.style.top="",this.canvas.style.left="",this.canvas.style.width="",this.canvas.style.height="",this._origCanvasBg!==void 0&&(this.canvas.style.background=this._origCanvasBg,this._origCanvasBg=void 0),console.log("[GL] WebGL2 rendering disabled")}}async _blend(){if(this._useGPU&&this.nodes.length>5e4)try{await Yt(this.nodes,this.groupNames,this.propWeights,this.smoothAlpha,this.adjList,this.nodeIndexFull,5,this.quantMode,this._quantStats),this._blendGen++;return}catch(t){console.warn("[GPU] Blend failed, falling back to CPU:",t.message)}Be(this.nodes,this.groupNames,this.propWeights,this.smoothAlpha,this.adjList,this.nodeIndexFull,5,this.quantMode,this._quantStats),this._blendGen++}setWeights(t){Object.assign(this.propWeights,t),this._refreshPropCache(),this._blend().then(()=>{this.layoutAll(),this.render()})}setAlpha(t){this.smoothAlpha=t,this.levels=new Array(ne.length).fill(null),this._blend().then(()=>{this.layoutAll(),this.render()})}setOptions(t){t.heatmapMode!==void 0&&(this.heatmapMode=t.heatmapMode),t.edgeMode!==void 0&&(this.edgeMode=t.edgeMode),t.sizeBy!==void 0&&(this.sizeBy=t.sizeBy),t.sizeLog!==void 0&&(this.sizeLog=t.sizeLog),t.labelProps!==void 0&&(this.labelProps=new Set(t.labelProps),this._refreshPropCache()),this.render()}resetView(){this.currentLevel=this._initLevel,this.baseLevel=this._initLevel,this.zoom=1,this.pan={x:0,y:0},this.selectedId=null,this.hoveredId=null,this._colorScheme!==this._initColorScheme&&(this.colorScheme=this._initColorScheme),this.resize()}exportLayout(){let t=["# id	px	py	gx	gy"];for(let o of this.nodes)t.push(`${o.id}	${o.px}	${o.py}	${o.gx}	${o.gy}`);return t.join(`
`)}_resetBtnRect(){if(!this.showResetBtn)return null;let t=24;return{x:this.W-t-8,y:8,w:t,h:t}}_bindEvents(){let t=this.canvas,o={signal:this._abortController.signal};t.addEventListener("mousedown",r=>{this.mouseDown=!0,this.mouseMoved=!1,this.mouseStart={x:r.clientX,y:r.clientY}},o),t.addEventListener("mousemove",r=>{if(!this.mouseDown){let i=t.getBoundingClientRect(),a=r.clientX-i.left,l=r.clientY-i.top,c=this._resetBtnRect();if(c&&a>=c.x&&a<=c.x+c.w&&l>=c.y&&l<=c.y+c.h){t.style.cursor="pointer";return}let h=this.hitTest(a,l),f=h?h.type==="node"?h.item.id:h.item.bid:null;f!==this.hoveredId&&(this.hoveredId=f,t.style.cursor=f?"pointer":"grab",this._onHover&&this._onHover(h),this.render());return}this.pan.x+=r.clientX-this.mouseStart.x,this.pan.y+=r.clientY-this.mouseStart.y,this.mouseStart={x:r.clientX,y:r.clientY},(Math.abs(this.pan.x)>4||Math.abs(this.pan.y)>4)&&(this.mouseMoved=!0),this.render()},o),t.addEventListener("mouseup",r=>{if(this.mouseDown=!1,!this.mouseMoved){let i=t.getBoundingClientRect(),a=r.clientX-i.left,l=r.clientY-i.top,c=this._resetBtnRect();if(c&&a>=c.x&&a<=c.x+c.w&&l>=c.y&&l<=c.y+c.h){this.resetView();return}if(a<40&&l<20){this.showFps=!this.showFps,this.render();return}let h=this.hitTest(a,l),f=r.ctrlKey||r.metaKey||r.shiftKey;if(h){let d=h.type==="node"?h.item.id:h.item.bid;f?this.toggleSelection(d):this.selectedId=d,this._onSelect&&this._onSelect(h)}else f||(this.selectedId=null);this.render()}},o),t.addEventListener("mouseleave",()=>{this.mouseDown=!1},o),t.addEventListener("dblclick",r=>{r.preventDefault();let i=t.getBoundingClientRect(),a=r.clientX-i.left,l=r.clientY-i.top;if(r.shiftKey)this._animateZoom(1/2,a,l);else{let c=this.hitTest(a,l);c?this._zoomToHit(c):this._animateZoom(2,a,l)}},o);let n=r=>{let i=t.getBoundingClientRect();return{id:r.identifier,x:r.clientX-i.left,y:r.clientY-i.top}},s=(r,i)=>Math.sqrt((r.x-i.x)**2+(r.y-i.y)**2);t.addEventListener("touchstart",r=>{r.preventDefault(),this.touchMoved=!1,r.touches.length===1?(this.t1=n(r.touches[0]),this.t2=null):r.touches.length===2&&(this.t1=n(r.touches[0]),this.t2=n(r.touches[1]))},{passive:!1,signal:this._abortController.signal}),t.addEventListener("touchmove",r=>{if(r.preventDefault(),this.touchMoved=!0,r.touches.length===1&&!this.t2){let i=n(r.touches[0]);this.t1&&(this.pan.x+=i.x-this.t1.x,this.pan.y+=i.y-this.t1.y),this.t1=i,this.render()}else if(r.touches.length===2){let i=n(r.touches[0]),a=n(r.touches[1]);if(this.t1&&this.t2){let l=s(i,a)/(s(this.t1,this.t2)||1),c=(i.x+a.x)/2,h=(i.y+a.y)/2,f=this.renderZoom;this.zoom=Math.max(.25,Math.min(1e4,this.zoom*l)),this._checkAutoLevel();let d=this.renderZoom/f;this.pan.x=c-(c-this.pan.x)*d,this.pan.y=h-(h-this.pan.y)*d;let u=(this.t1.x+this.t2.x)/2,m=(this.t1.y+this.t2.y)/2;this.pan.x+=c-u,this.pan.y+=h-m,this.render()}this.t1=i,this.t2=a}},{passive:!1,signal:this._abortController.signal}),t.addEventListener("touchend",r=>{if(r.preventDefault(),r.touches.length===0){if(!this.touchMoved&&this.t1){let i=this.hitTest(this.t1.x,this.t1.y);i?(this.selectedId=i.type==="node"?i.item.id:i.item.bid,this._onSelect&&this._onSelect(i)):this.selectedId=null,this.render()}this.t1=null,this.t2=null}else r.touches.length===1&&(this.t1=n(r.touches[0]),this.t2=null,this.touchMoved=!0)},{passive:!1,signal:this._abortController.signal}),t.addEventListener("touchcancel",()=>{this.t1=null,this.t2=null},o),t.addEventListener("wheel",r=>{r.preventDefault();let i=t.getBoundingClientRect(),a=r.clientX-i.left,l=r.clientY-i.top,c=r.deltaY<0?1.05:1/1.05,h=this.renderZoom;this.zoom=Math.max(.25,Math.min(1e4,this.zoom*c)),this._checkAutoLevel();let f=this.renderZoom/h;this.pan.x=a-(a-this.pan.x)*f,this.pan.y=l-(l-this.pan.y)*f,this.render()},{passive:!1,signal:this._abortController.signal}),t.setAttribute("tabindex","0"),t.addEventListener("keydown",r=>{r.key==="ArrowLeft"&&this.currentLevel>0?(r.preventDefault(),this.switchLevel(this.currentLevel-1)):r.key==="ArrowRight"&&this.currentLevel<Xe.length-1?(r.preventDefault(),this.switchLevel(this.currentLevel+1)):r.key==="+"||r.key==="="?(r.preventDefault(),this._zoomBy(1.15)):r.key==="-"||r.key==="_"?(r.preventDefault(),this._zoomBy(1/1.15)):r.key==="f"?(this.showFps=!this.showFps,this.render()):r.key==="l"?(this.showLegend=(this.showLegend+1)%5,this.render()):r.key==="c"&&this.cycleColorScheme()},o),typeof ResizeObserver<"u"&&(this._resizeObserver=new ResizeObserver(()=>this.resize()),this._resizeObserver.observe(t))}destroy(){this._abortController.abort(),this._gl&&this._destroyWebGL(),this._resizeObserver&&(this._resizeObserver.disconnect(),this._resizeObserver=null),this._edgeBuildRaf&&(cancelAnimationFrame(this._edgeBuildRaf),this._edgeBuildRaf=null)}_zoomBy(t){let o=this.renderZoom;this.zoom=Math.max(.25,Math.min(1e4,this.zoom*t)),this._checkAutoLevel();let n=this.renderZoom/o;this.pan.x=this.W/2-(this.W/2-this.pan.x)*n,this.pan.y=this.H/2-(this.H/2-this.pan.y)*n,this.render()}_animateZoom(t,o,n){let s={x:this.pan.x,y:this.pan.y},r=this.zoom,i=Math.max(.25,r*t),a=this.renderZoom,c=Math.max(1,i*Math.pow(2,this.currentLevel-this.baseLevel))/a,h={x:o-(o-s.x)*c,y:n-(n-s.y)*c},f=performance.now(),d=u=>{let m=Math.min(1,(u-f)/300),p=1-Math.pow(1-m,3);this.zoom=r+(i-r)*p,this.pan.x=s.x+(h.x-s.x)*p,this.pan.y=s.y+(h.y-s.y)*p,this.renderNow(),m<1?requestAnimationFrame(d):(this._checkAutoLevel(),this.renderNow())};requestAnimationFrame(d)}_zoomToHit(t){let o=t.item,n={x:this.pan.x,y:this.pan.y},s=this.zoom,r=s*2,i=this.worldToScreen(o.x,o.y),a=this.renderZoom,c=Math.max(1,r*Math.pow(2,this.currentLevel-this.baseLevel))/a,h={x:this.W/2-(this.W/2-n.x)*c-(i.x-this.W/2)*c,y:this.H/2-(this.H/2-n.y)*c-(i.y-this.H/2)*c},f=performance.now(),d=u=>{let m=Math.min(1,(u-f)/350),p=1-Math.pow(1-m,3);this.zoom=s+(r-s)*p,this.pan.x=n.x+(h.x-n.x)*p,this.pan.y=n.y+(h.y-n.y)*p,this.renderNow(),m<1?requestAnimationFrame(d):(this._checkAutoLevel(),this.renderNow())};requestAnimationFrame(d)}};function Zt(e,t,o,n,s,r,i,a){let l={};for(let p of r)l[p]=p==="group"?3:p==="label"?1:0;Object.assign(l,a.weights||{});let c={},h={};for(let p of r)h[p]=new Set;for(let p of t){if(h.group.add(p.group||"unknown"),h.label.add(p.label||p.id),h.structure.add(`deg:${p.degree}`),h.neighbors.add("_"),p.edgeTypes){let g=Array.isArray(p.edgeTypes)?p.edgeTypes:[...p.edgeTypes];for(let _ of g)h.edgetype&&h.edgetype.add(_)}if(p.extraProps)for(let[g,_]of Object.entries(p.extraProps))h[g]&&h[g].add(_==null?"unknown":String(_))}for(let p of r)c[p]=Te([...h[p]].sort(),a.colorScheme||0);let f=a.smoothAlpha||0,d=a.quantMode,u=new qe(e,{nodes:t,edges:o,nodeIndexFull:n,adjList:s,groupNames:r,propWeights:l,propColors:c,groupColors:c.group,hasEdgeTypes:i,smoothAlpha:f,quantMode:d,...a}),m=a.useGPU||a.autoGPU!==!1&&t.length*r.length>2e3;return(async()=>{if(m&&await mt().catch(()=>!1)&&(u.useGPU=!0,console.log(`[GPU] GPU enabled (${t.length} nodes, ${r.length} groups)`)),a.autoTune){u.showProgress("Auto-tuning...");let p={...a.autoTune};p.onProgress=_=>{let w=Math.round(100*_.step/Math.max(1,_.total)),A=_.phase==="presets"?"scanning presets":_.phase==="done"?"done":"refining";u.showProgress(`Auto-tuning: ${A} (${w}%)`)};let g=await tt(u.nodes,u.groupNames,u.adjList,u.nodeIndexFull,p);if(p.weights!==!1&&!a.weights)for(let _ of u.groupNames)u.propWeights[_]=g.weights[_]??0;p.alpha!==!1&&a.smoothAlpha==null&&(u.smoothAlpha=g.alpha),p.quant!==!1&&!a.quantMode&&(u.quantMode=g.quantMode),g.labelProps&&!a.labelProps&&(u.labelProps=new Set(g.labelProps.filter(_=>u.groupNames.includes(_)))),u._quantStats={}}u.levels=new Array(ne.length).fill(null),await u._blend(),u._progressText=null,u._refreshPropCache(),u.layoutAll(),u.render()})(),u}function Kt(e,t,o,n){let s=o.length,r=e.map((l,c)=>{let h={};for(let f=0;f<s;f++){let d=(c*s+f)*2;h[o[f]]=[t[d],t[d+1]]}return{...l,projections:h,px:0,py:0,gx:0,gy:0,x:0,y:0}}),i=Object.fromEntries(r.map(l=>[l.id,l])),a=Object.fromEntries(r.map(l=>[l.id,[]]));for(let l of n)a[l.src]&&a[l.dst]&&(a[l.src].push(l.dst),a[l.dst].push(l.src));return{nodes:r,nodeIndexFull:i,adjList:a}}function Ye(e,t,o,n={}){let s=qt(t,o),{nodes:r,nodeIndexFull:i,adjList:a}=Kt(s.nodeArray,s.projBuf,s.groupNames,s.edges);return Zt(e,r,s.edges,i,a,s.groupNames,s.hasEdgeTypes,n)}function _t(e,t,o,n={}){let s={},r={},i=t.map(g=>{let _=g.id,w=g.group||"unknown",A=g.label||_,M={};for(let x in g)x!=="id"&&x!=="group"&&x!=="label"&&(M[x]=g[x]);let y={id:_,group:w,label:A,degree:0,edgeTypes:null,extraProps:M};return s[_]=y,r[_]=[],y}),a=[];for(let g of o)s[g.src]&&s[g.dst]&&(a.push(g),s[g.src].degree++,s[g.dst].degree++,r[g.src].push(g.dst),r[g.dst].push(g.src));let l=[];if(i.length>0)for(let g of Object.keys(i[0].extraProps))l.push(g);let c=["group","label","structure","neighbors"];for(let g of l)c.push(g);let h=i.map(g=>r[g.id].map(_=>s[_].group)),f={};for(let g of l){let _=0,w=0,A=1/0,M=-1/0;for(let y of i){let x=y.extraProps[g];if(x==null||x==="")continue;w++;let v=Number(x);isFinite(v)&&(_++,v<A&&(A=v),v>M&&(M=v))}w>0&&_/w>=.8&&M>A&&(f[g]={min:A,max:M,coarse:5,medium:50,fine:500})}let{projBuf:d}=gt(i,h,c,!1,l,f),{nodes:u,nodeIndexFull:m,adjList:p}=Kt(i,d,c,a);return Zt(e,u,a,m,p,c,!1,n)}var Xt={level:{prop:"initialLevel",type:"int",default:3},heatmap:{prop:"heatmapMode",type:"string",default:"off"},"edge-mode":{prop:"edgeMode",type:"string",default:"curves"},quant:{prop:"quantMode",type:"string",default:"gaussian"},alpha:{prop:"smoothAlpha",type:"float",default:0},"color-scheme":{prop:"colorScheme",type:"int",default:ze},"size-by":{prop:"sizeBy",type:"string",default:"edges"},webgl:{prop:"webgl",type:"bool",default:!1},"auto-gpu":{prop:"autoGPU",type:"bool",default:!0},"use-gpu":{prop:"useGPU",type:"bool",default:!1},"auto-tune":{prop:"autoTune",type:"json",default:null}},fn=["legend","reset-btn","light-mode","size-log","webgl","auto-gpu"];function dn(e,t){if(e!=null)switch(t){case"int":return parseInt(e,10)||0;case"float":return parseFloat(e)||0;case"bool":return e!=="false"&&e!=="0";case"string":return e;case"json":try{return JSON.parse(e)}catch{return null}default:return e}}var Ze=class extends HTMLElement{static get observedAttributes(){return["edges","nodes","format",...Object.keys(Xt),...fn]}constructor(){super(),this._view=null,this._shadow=this.attachShadow({mode:"open"}),this._shadow.innerHTML=`<style>
      :host { display: block; position: relative; }
      .wrap { width: 100%; height: 100%; position: relative; }
      canvas { width: 100%; height: 100%; display: block; background: var(--bz-bg, #12122a); }
    </style><div class="wrap"><canvas></canvas></div>`,this._canvas=this._shadow.querySelector("canvas")}connectedCallback(){requestAnimationFrame(()=>this._init())}disconnectedCallback(){this._view&&(this._view.destroy(),this._view=null)}async _init(){if(this._view)return;let t=this._buildOpts(),o=this.getAttribute("edges"),n=this.getAttribute("nodes"),s=this.getAttribute("format"),r=this.textContent.trim();if(o){let[i,a]=await Promise.all([fetch(o).then(l=>l.text()),n?fetch(n).then(l=>l.text()).catch(()=>null):Promise.resolve(null)]);this._view=Ye(this._canvas,i,a,t)}else if(r&&s==="json"){let i=JSON.parse(r),a=i.nodes||[],l=i.edges||[];this._view=_t(this._canvas,a,l,t)}else if(r){let i=r.split(`
`),a=r,l=null,c=i.findIndex((h,f)=>f>0&&h.startsWith("# ")&&i[f-1].trim()==="");c>0&&(a=i.slice(0,c-1).join(`
`),l=i.slice(c).join(`
`)),this._view=Ye(this._canvas,a,l,t)}}_buildOpts(){let t={},o=this.getAttribute("weights");if(o){t.weights={};for(let s of o.split(",")){let[r,i]=s.split(":");r&&i&&(t.weights[r.trim()]=parseFloat(i.trim())||0)}}let n=this.getAttribute("label-props");n&&(t.labelProps=n.split(",").map(s=>s.trim()));for(let[s,r]of Object.entries(Xt)){let i=this.getAttribute(s);i!==null&&(t[r.prop]=dn(i,r.type))}return this.hasAttribute("legend")&&(t.showLegend=!0),this.hasAttribute("reset-btn")&&(t.showResetBtn=!0),this.hasAttribute("light-mode")&&(t.lightMode=!0),this.hasAttribute("size-log")&&(t.sizeLog=!0),t}get view(){return this._view}attributeChangedCallback(t,o,n){if(!this._view||o===n)return;let s=this._view;switch(t){case"level":s.switchLevel(parseInt(n)||0);break;case"alpha":s.setAlpha(parseFloat(n)||0);break;case"color-scheme":s.colorScheme=parseInt(n)||0;break;case"light-mode":s.lightMode=this.hasAttribute("light-mode");break;case"legend":s.showLegend=this.hasAttribute("legend")?1:0,s.render();break;case"heatmap":s.setOptions({heatmapMode:n||"off"}),s.render();break;case"edge-mode":s.setOptions({edgeMode:n||"curves"}),s.render();break}}};customElements.define("bz-graph",Ze);export{qe as BitZoomCanvas,Ze as BzGraph,et as COLOR_SCHEME_NAMES,fo as SCHEME_DIVERGING,ho as SCHEME_GRAYSCALE,po as SCHEME_GREENS,lo as SCHEME_INFERNO,co as SCHEME_PLASMA,go as SCHEME_REDS,uo as SCHEME_THERMAL,ao as SCHEME_VIRIDIS,ze as SCHEME_VIVID,tt as autoTuneWeights,_t as createBitZoomFromGraph,Ye as createBitZoomView,Te as generateGroupColors,mt as initGPU,yo as isWebGL2Available};

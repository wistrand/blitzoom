function ye(e){let t="",o=-1;for(let n in e)e[n]>o&&(o=e[n],t=n);return t}var Z=128,he=2147483647,Le=16,z=1<<Le,ne=[1,2,3,4,5,6,7,8,9,10,11,12,13,14],se=14,Xe=["L1","L2","L3","L4","L5","L6","L7","L8","L9","L10","L11","L12","L13","L14","RAW"],$e=.1,Qe=.1;function Mt(e){return function(){e|=0,e=e+1831565813|0;let t=Math.imul(e^e>>>15,1|e);return t=t+Math.imul(t^t>>>7,61|t)^t,((t^t>>>14)>>>0)/4294967296}}var yt=Mt(42),He=new Int32Array(Z),Oe=new Int32Array(Z);for(let e=0;e<Z;e++)He[e]=Math.floor(yt()*(he-1))+1,Oe[e]=Math.floor(yt()*(he-1));function Ke(e){let t=0;for(let o=0;o<e.length;o++)t=Math.imul(31,t)+e.charCodeAt(o)|0;return t>>>0}var te=new Int32Array(Z);function xt(e){return e=(e&he)+(e/2147483648|0),e>=he?e-he:e}function vt(e,t,o){let n=t>>>16,s=t&65535,r=xt(e*n);return xt(r*65536+e*s+o)}var be=new Uint8Array(Z);function fe(e,t){if(t===0){for(let o=0;o<Z;o++)te[o]=-1;return}if(t<12){for(let o=0;o<Z;o++)te[o]=he;for(let o=0;o<t;o++){let n=Ke(e[o]);for(let s=0;s<Z;s++){let r=vt(He[s],n,Oe[s]);r<te[s]&&(te[s]=r)}}return}for(let o=0;o<Z;o++)te[o]=he,be[o]=0;for(let o=0;o<t;o++){let n=Ke(e[o]),s=vt(He[0],n,Oe[0]),r=s%Z,i=s/Z|0;i<te[r]&&(te[r]=i,be[r]=1)}for(let o=0;o<Z;o++){if(be[o])continue;let n=(o*2654435761>>>0)%Z,s=0;for(;!be[n]&&s<Z;)n=(n*2654435761+1>>>0)%Z,s++;be[n]&&(te[o]=te[n])}}function Re(e,t){let o=Mt(e),n=[new Float64Array(t),new Float64Array(t)];for(let s=0;s<2;s++)for(let r=0;r<t;r+=2){let i=Math.max(1e-10,o()),a=o(),l=Math.sqrt(-2*Math.log(i));n[s][r]=l*Math.cos(2*Math.PI*a),r+1<t&&(n[s][r+1]=l*Math.sin(2*Math.PI*a))}return n}function de(e,t,o,n){if(e[0]===-1){o[n]=0,o[n+1]=0;return}let s=0;for(let d=0;d<Z;d++)s+=e[d];s/=Z;let r=0;for(let d=0;d<Z;d++){let p=e[d]-s;r+=p*p}let i=Math.sqrt(r/Z)||1,a=t[0],l=t[1],c=0,h=0;for(let d=0;d<Z;d++){let p=(e[d]-s)/i;c+=p*a[d],h+=p*l[d]}o[n]=c,o[n+1]=h}function Ge(e,t,o){let n=Le-o,s=e>>n,r=t>>n;return s<<o|r}function Pe(e){let t=e.length,o=e.map((s,r)=>({i:r,v:s.px,id:s.id})).sort((s,r)=>s.v-r.v||(s.id<r.id?-1:s.id>r.id?1:0));for(let s=0;s<t;s++)e[o[s].i].gx=Math.min(z-1,Math.floor(s/t*z)),e[o[s].i].px=s/t*2-1;let n=e.map((s,r)=>({i:r,v:s.py,id:s.id})).sort((s,r)=>s.v-r.v||(s.id<r.id?-1:s.id>r.id?1:0));for(let s=0;s<t;s++)e[n[s].i].gy=Math.min(z-1,Math.floor(s/t*z)),e[n[s].i].py=s/t*2-1}var xe=8192,_e=new Float64Array(xe+1);{let e=t=>{let i=Math.abs(t),a=1/(1+.278393*i+.230389*i*i+972e-6*i*i*i+.078108*i*i*i*i),l=1-a*a*a*a;return t>=0?l:-l};for(let t=0;t<=xe;t++){let o=t/xe*8-4;_e[t]=.5*(1+e(o*Math.SQRT1_2))}}function At(e){let t=(e+4)*(xe/8),o=t|0;if(o>=xe)return _e[xe];if(o<0)return _e[0];let n=t-o;return _e[o]+n*(_e[o+1]-_e[o])}function Be(e,t){let o=e.length;if(o===0)return;let n,s,r,i;if(t&&t._initialized)n=t.mx,s=t.my,r=t.sx,i=t.sy;else{let a=0,l=0;for(let d=0;d<o;d++)a+=e[d].px,l+=e[d].py;n=a/o,s=l/o;let c=0,h=0;for(let d=0;d<o;d++){let p=e[d].px-n,u=e[d].py-s;c+=p*p,h+=u*u}r=Math.sqrt(c/o)||1,i=Math.sqrt(h/o)||1,t&&(t.mx=n,t.my=s,t.sx=r,t.sy=i,t._initialized=!0)}for(let a=0;a<o;a++){let l=At((e[a].px-n)/r),c=At((e[a].py-s)/i);e[a].gx=Math.min(z-1,Math.floor(l*z)),e[a].gy=Math.min(z-1,Math.floor(c*z)),e[a].px=l*2-1,e[a].py=c*2-1}}function Ce(e,t,o,n,s,r,i,a,l){let c=o,h=0;for(let S of t){let A=c[S]||0;A>h&&(h=A)}let d=Math.max(h*$e,Qe),p=0,u={};for(let S of t)u[S]=Math.max(c[S]||0,d),p+=u[S];let m=e.length,g=new Float64Array(m),f=new Float64Array(m);for(let S=0;S<m;S++){let A=e[S],x=0,y=0;for(let v of t){let M=A.projections[v];M&&(x+=M[0]*u[v],y+=M[1]*u[v])}g[S]=x/p,f[S]=y/p,A.px=g[S],A.py=f[S]}let _=()=>a==="gaussian"?Be(e,l):Pe(e);if(n===0||i===0){_();return}let w=Math.max(0,Math.min(1,n));for(let S=0;S<i;S++){let A=new Float64Array(m),x=new Float64Array(m);for(let y=0;y<m;y++){let v=e[y],M=s[v.id];if(M&&M.length>0){let b=0,R=0,B=0;for(let P of M){let C=r[P];C&&(b+=C.px,R+=C.py,B++)}B>0?(b/=B,R/=B,A[y]=(1-w)*g[y]+w*b,x[y]=(1-w)*f[y]+w*R):(A[y]=g[y],x[y]=f[y])}else A[y]=g[y],x[y]=f[y]}for(let y=0;y<m;y++)e[y].px=A[y],e[y].py=x[y]}_()}function wt(e,t,o,n,s){let r=new Map;for(let a=0;a<t.length;a++){let l=t[a],c=Ge(l.gx,l.gy,e),h=r.get(c);h||(h=[],r.set(c,h)),h.push(l)}let i=[];for(let[a,l]of r){let c=a>>e,h=a&(1<<e)-1,d={},p={},u={},m=0,g=0,f=0,_=-1,w=l[0];for(let P=0;P<l.length;P++){let C=l[P];if(g+=C.px,f+=C.py,d[C.group]=(d[C.group]||0)+1,o){let E=o(C);p[E]=(p[E]||0)+1}if(n){let E=n(C);u[E]=(u[E]||0)+1}m+=C.degree,C.degree>_&&(_=C.degree,w=C)}let S=g/l.length,A=f/l.length,x=ye(d),y=m/l.length,v=m,M=w.label||w.id,b=o?ye(p):x,R=s&&s(b)||"#888888",B=n?ye(u):M;i.push({bid:a,members:l,ax:S,ay:A,domGroup:x,avgDegree:y,totalDegree:v,repName:M,cachedColorVal:b,cachedColor:R,cachedLabel:B,x:0,y:0,cx:c,cy:h})}return{supernodes:i,snEdges:[],level:e,_edgesReady:!1}}function ae(e,t,o){if(t==="label")return e.label||e.id;if(t==="group")return e.group||"unknown";if(t==="structure")return`deg:${e.degree}`;if(t==="neighbors")return`${(o[e.id]||[]).length} nbrs`;if(t==="edgetype"&&e.edgeTypes){let n=Array.isArray(e.edgeTypes)?e.edgeTypes:[...e.edgeTypes];return n.length>0?n[0]:e.id}if(e.extraProps&&Object.prototype.hasOwnProperty.call(e.extraProps,t)){let n=e.extraProps[t];return n!=null?String(n):e.label||e.id}return e.label||e.id}function Je(e,t,o){if(t==="label")return e.repName;let n={};for(let s of e.members){let r=ae(s,t,o);n[r]=(n[r]||0)+1}return ye(n)}function $t(e,t,o){t/=100,o/=100;let n=t*Math.min(o,1-o),s=r=>{let i=(r+e/30)%12,a=o-n*Math.max(Math.min(i-3,9-i,1),-1);return Math.round(255*a).toString(16).padStart(2,"0")};return`#${s(0)}${s(8)}${s(4)}`}function Qt(e,t,o){return"#"+((1<<24)+(e<<16)+(t<<8)+o).toString(16).slice(1)}function Jt(e,t){t=Math.max(0,Math.min(1,t));let o=t*(e.length-1),n=Math.floor(o),s=Math.min(n+1,e.length-1),r=o-n;return Qt(Math.round(e[n][0]+(e[s][0]-e[n][0])*r),Math.round(e[n][1]+(e[s][1]-e[n][1])*r),Math.round(e[n][2]+(e[s][2]-e[n][2])*r))}function ce(e){return t=>{let o={},n=t.length;for(let s=0;s<n;s++)o[t[s]]=Jt(e,n===1?.5:s/(n-1));return o}}var zt=[[72,35,116],[64,67,135],[52,94,141],[41,120,142],[32,144,140],[34,167,132],[68,190,112],[121,209,81],[189,222,38],[253,231,37]],eo=[[126,3,167],[168,34,150],[203,70,121],[229,107,93],[248,148,65],[253,195,40],[239,248,33]],to=[[106,23,110],[147,38,103],[188,55,84],[221,81,58],[243,118,27],[252,165,10],[246,215,70],[252,255,164]],oo=[[80,50,155],[120,40,160],[165,30,140],[200,35,100],[225,60,60],[240,100,30],[250,155,15],[255,220,50]],no=[[45,100,55],[60,135,65],[80,165,80],[100,190,100],[130,210,130],[170,228,160],[210,243,200]],so=[[140,30,30],[175,40,35],[210,55,40],[230,80,50],[240,120,75],[248,165,110],[252,210,165]],ro=[[69,117,180],[116,173,209],[171,217,233],[224,243,248],[255,255,191],[254,224,144],[253,174,97],[244,109,67],[215,48,39]],io=[[90,90,100],[120,120,130],[150,150,160],[180,180,190],[210,210,218],[235,235,242]],ze=0,ao=1,co=2,lo=3,uo=4,ho=5,fo=6,po=7,go=8,et=["vivid","viridis","plasma","inferno","thermal","grayscale","diverging","greens","reds"],Te=[e=>{let t={};for(let n=0;n<e.length;n++)t[e[n]]=$t(n*137.508%360,65,62);return t},ce(zt),ce(eo),ce(to),ce(oo),ce(io),ce(ro),ce(no),ce(so)];function Ie(e,t=0){return Te[t%Te.length](e)}function mo(e,t){let o=16-t,n=1<<t,s=n*n,r=new Map;for(let u=0;u<e.length;u++){let m=(e[u].gx>>o)*n+(e[u].gy>>o);r.set(m,(r.get(m)||0)+1)}let i=r.size;if(i<=1)return 0;let a=i/s,l=0,c=0;for(let u of r.values())l+=u,c+=u*u;let h=l/i,d=c/i-h*h,p=Math.sqrt(Math.max(0,d))/Math.max(1,h);return a*p}function _o(e,t){t==="gaussian"?Be(e,{}):Pe(e)}var St=()=>new Promise(e=>requestAnimationFrame(e));async function tt(e,t,o,n,s={}){let r=performance.now(),i=s.weights!==!1,a=s.alpha!==!1,l=s.quant!==!1,c=s.onProgress,h=s.signal,d=s.timeout??2e4,p=[0,3,8,10],u=[0,.25,.5,.75,1],m=l?["rank","gaussian"]:["gaussian"],g=a?u:[0],f=Math.max(3,Math.min(7,Math.round(Math.log2(e.length)-2))),_=new Set(["label","structure","neighbors"]),w=t.filter(T=>{if(_.has(T))return!1;if(T==="edgetype"){let j=new Set;for(let D of e){if(D.edgeTypes)for(let Y of D.edgeTypes)j.add(Y);if(j.size>2)return!0}return!1}return!0}),S=!1;if(i)for(let T of w){let j=new Set;for(let D of e){let Y=T==="group"?D.group:D.extraProps&&D.extraProps[T]||void 0;if(j.add(Y),j.size>1){S=!0;break}}if(S)break}let A=i&&S,x=-1,y={},v=0,M="gaussian",b=0,R=0,B=0,P=w.length,C=(A?P+2:1)*g.length,E=(A?P*p.length:0)+(a?u.length:0),F=C+E*3,H=performance.now(),G=!1,V=()=>h?.aborted||d>0&&performance.now()-r>d,q=async T=>{if(V()){G=!0;return}performance.now()-H>50&&(c&&c({phase:T,step:B,total:F,score:x}),await St(),H=performance.now(),V()&&(G=!0))},J=async T=>{if(V()){G=!0;return}c&&c({phase:T,step:B,total:F,score:x}),await St(),H=performance.now(),V()&&(G=!0)},k=new Float64Array(e.length),O=new Float64Array(e.length),U=s.blendFn||Ce,I=(T,j)=>{U(e,t,T,j,o,n,5,"gaussian",{}),b++;for(let $=0;$<e.length;$++)k[$]=e[$].px,O[$]=e[$].py;let D=-1,Y="gaussian";for(let $ of m){for(let ie=0;ie<e.length;ie++)e[ie].px=k[ie],e[ie].py=O[ie];_o(e,$),R++;let ue=mo(e,f);ue>D&&(D=ue,Y=$)}return B++,{score:D,quant:Y}},W=[],Q={};for(let T of t)Q[T]=w.includes(T)?3:0;if(W.push(Q),A)for(let T of w){let j={};for(let D of t)j[D]=D===T?8:0;W.push(j)}await J("presets");let X=[];for(let T=0;T<W.length&&!G;T++){let j=W[T];for(let D of g){let{score:Y,quant:$}=I(j,D);if(Y>x&&(x=Y,y={...j},v=D,M=$),T>0&&D===0&&X.push({group:w[T-1],score:Y}),await q("presets"),G)break}}if(A&&X.length>=2&&!G){X.sort((Y,$)=>$.score-Y.score);let T=X[0].group,j=X[1].group,D={};for(let Y of t)D[Y]=Y===T||Y===j?5:0;for(let Y of g){if(G)break;let{score:$,quant:ue}=I(D,Y);$>x&&(x=$,y={...D},v=Y,M=ue),await q("presets")}}for(let T=0;T<3&&!G;T++){let j=!1;if(await J("descent"),G)break;if(A)for(let D of w){if(G)break;let Y=y[D];for(let $ of p){y[D]=$;let{score:ue,quant:ie}=I(y,v);if(ue>x&&(x=ue,Y=$,M=ie,j=!0),await q("descent"),G)break}y[D]=Y}if(a&&!G)for(let D of u){let{score:Y,quant:$}=I(y,D);if(Y>x&&(x=Y,v=D,M=$,j=!0),await q("descent"),G)break}if(!j)break}Ce(e,t,y,v,o,n,5,M,{}),c&&c({phase:"done",step:F,total:F,score:x});let L=[],N=0,ee=null;for(let T of w)(y[T]||0)>N&&(N=y[T]||0,ee=T);if(ee&&ee!=="label"&&L.push(ee),t.includes("label")){let T=new Set;for(let j of e)if(T.add(j.label||j.id),T.size>e.length*.8)break;T.size>1&&T.size<=e.length*.8&&L.push("label")}return{weights:y,alpha:v,quantMode:M,labelProps:L,score:x,blends:b,quants:R,timeMs:Math.round(performance.now()-r)}}function yo(){try{let e=document.createElement("canvas");e.addEventListener("webglcontextlost",o=>o.preventDefault());let t=e.getContext("webgl2");return t?(t.getExtension("WEBGL_lose_context")?.loseContext(),!0):!1}catch{return!1}}function Lt(e){let t=e.getContext("webgl2",{alpha:!1,antialias:!1});if(!t)return console.log("[GL] WebGL2 context creation failed"),null;if(console.log("[GL] WebGL2 context created"),t.getExtension("EXT_color_buffer_half_float"),t.getExtension("EXT_color_buffer_float"),t.getExtension("EXT_float_blend"),t._hasFloatLinear=!!t.getExtension("OES_texture_float_linear"),t.getExtension("EXT_color_buffer_float"),t._circleProgram=To(t),!t._circleProgram)return console.log("[GL] Circle shader compilation failed"),null;let o=new Float32Array([-1,-1,1,-1,-1,1,1,1]);t._quadVBO=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,t._quadVBO),t.bufferData(t.ARRAY_BUFFER,o,t.STATIC_DRAW);let n=new Float32Array([0,-1,1,-1,0,1,1,1]);t._edgeLineQuadVBO=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,t._edgeLineQuadVBO),t.bufferData(t.ARRAY_BUFFER,n,t.STATIC_DRAW);let s=16;t._curveSegCount=s;let r=new Float32Array((s+1)*4);for(let i=0;i<=s;i++){let a=i/s;r[i*4]=a,r[i*4+1]=-1,r[i*4+2]=a,r[i*4+3]=1}return t._edgeCurveVBO=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,t._edgeCurveVBO),t.bufferData(t.ARRAY_BUFFER,r,t.STATIC_DRAW),t._instanceVBO=t.createBuffer(),t._edgeLineProgram=Et(t,Po),t._edgeCurveProgram=Et(t,Bo),!t._edgeLineProgram||!t._edgeCurveProgram?(console.log("[GL] Edge shader compilation failed"),null):(t._gridProgram=Io(t),t._gridProgram?(t._heatSplatProg=Fo(t),t._heatResolveProg=Ho(t),!t._heatSplatProg||!t._heatResolveProg?(console.log("[GL] Heatmap shader compilation failed"),null):(t._fsQuadVBO=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,t._fsQuadVBO),t.bufferData(t.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),t.STATIC_DRAW),t._heatFBO=null,t._heatTex=null,t._heatW=0,t._heatH=0,t._heatMaxW=0,t._heatMaxWTarget=0,t._heatMaxWKey="",t._heatFBOBroken=!1,t._heatMaxWTime=0,t._circleVAO=ko(t),t._edgeLineVAO=bt(t,t._edgeLineQuadVBO),t._edgeCurveVAO=bt(t,t._edgeCurveVBO),t._heatResolveVAO=Oo(t),t)):(console.log("[GL] Grid shader compilation failed"),null))}var xo=`#version 300 es
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
`;function re(e,t,o){let n=e.createShader(t);return e.shaderSource(n,o),e.compileShader(n),e.getShaderParameter(n,e.COMPILE_STATUS)?n:(console.error("[GL] Shader compile:",e.getShaderInfoLog(n)),e.deleteShader(n),null)}function Ae(e,t,o){let n=e.createProgram();return e.attachShader(n,t),e.attachShader(n,o),e.linkProgram(n),e.getProgramParameter(n,e.LINK_STATUS)?n:(console.error("[GL] Program link:",e.getProgramInfoLog(n)),e.deleteProgram(n),null)}function To(e){let t=re(e,e.VERTEX_SHADER,xo),o=re(e,e.FRAGMENT_SHADER,vo);if(!t||!o)return null;let n=Ae(e,t,o);if(!n)return null;n.u_resolution=e.getUniformLocation(n,"u_resolution");let s=re(e,e.VERTEX_SHADER,Ao),r=re(e,e.FRAGMENT_SHADER,Mo);if(!s||!r)return null;let i=Ae(e,s,r);return i?(i.u_resolution=e.getUniformLocation(i,"u_resolution"),n._glow=i,n):null}function Io(e){let t=re(e,e.VERTEX_SHADER,Lo),o=re(e,e.FRAGMENT_SHADER,Ro);if(!t||!o)return null;let n=Ae(e,t,o);return n?(n.u_resolution=e.getUniformLocation(n,"u_resolution"),n.u_gridSize=e.getUniformLocation(n,"u_gridSize"),n.u_pan=e.getUniformLocation(n,"u_pan"),n.u_lightMode=e.getUniformLocation(n,"u_lightMode"),n):null}function Fo(e){let t=re(e,e.VERTEX_SHADER,wo),o=re(e,e.FRAGMENT_SHADER,So);if(!t||!o)return null;let n=Ae(e,t,o);return n?(n.u_resolution=e.getUniformLocation(n,"u_resolution"),n):null}function Ho(e){let t=re(e,e.VERTEX_SHADER,Eo),o=re(e,e.FRAGMENT_SHADER,bo);if(!t||!o)return null;let n=Ae(e,t,o);return n?(n.u_density=e.getUniformLocation(n,"u_density"),n.u_maxW=e.getUniformLocation(n,"u_maxW"),n.u_lightMode=e.getUniformLocation(n,"u_lightMode"),n):null}function Oo(e){let t=e.createVertexArray();return e.bindVertexArray(t),e.bindBuffer(e.ARRAY_BUFFER,e._fsQuadVBO),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0),e.bindVertexArray(null),t}function Go(e,t,o){let n=Math.ceil(t/4),s=Math.ceil(o/4);if(e._heatW===n&&e._heatH===s)return;e._heatFBO&&e.deleteFramebuffer(e._heatFBO),e._heatTex&&e.deleteTexture(e._heatTex),e._heatTex=e.createTexture(),e.bindTexture(e.TEXTURE_2D,e._heatTex),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e._heatFBO=e.createFramebuffer(),e.bindFramebuffer(e.FRAMEBUFFER,e._heatFBO);let r=[{internal:e.RGBA16F,type:e.HALF_FLOAT,name:"RGBA16F"}];e._hasFloatLinear&&r.unshift({internal:e.RGBA32F,type:e.FLOAT,name:"RGBA32F"}),r.push({internal:e.RGBA8,type:e.UNSIGNED_BYTE,name:"RGBA8"});let i=!1;for(let a of r)if(e.texImage2D(e.TEXTURE_2D,0,a.internal,n,s,0,e.RGBA,a.type,null),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,e._heatTex,0),e.checkFramebufferStatus(e.FRAMEBUFFER)===e.FRAMEBUFFER_COMPLETE){a.name!=="RGBA32F"&&console.log(`[GL] Heatmap FBO using ${a.name}`),i=!0;break}i||(console.error("[GL] Heatmap FBO: no format works"),e._heatFBOBroken=!0),e.bindFramebuffer(e.FRAMEBUFFER,null),e._heatW=n,e._heatH=s}function Et(e,t){let o=re(e,e.VERTEX_SHADER,t),n=re(e,e.FRAGMENT_SHADER,Co);if(!o||!n)return null;let s=Ae(e,o,n);return s?(s.u_resolution=e.getUniformLocation(s,"u_resolution"),s.u_width=e.getUniformLocation(s,"u_width"),s):null}function bt(e,t){let o=e.createVertexArray();e.bindVertexArray(o),e.bindBuffer(e.ARRAY_BUFFER,t),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0);let n=32;return e.bindBuffer(e.ARRAY_BUFFER,e._instanceVBO),e.enableVertexAttribArray(1),e.vertexAttribPointer(1,2,e.FLOAT,!1,n,0),e.vertexAttribDivisor(1,1),e.enableVertexAttribArray(2),e.vertexAttribPointer(2,2,e.FLOAT,!1,n,8),e.vertexAttribDivisor(2,1),e.enableVertexAttribArray(3),e.vertexAttribPointer(3,4,e.FLOAT,!1,n,16),e.vertexAttribDivisor(3,1),e.bindVertexArray(null),o}function ko(e){let t=e.createVertexArray();e.bindVertexArray(t),e.bindBuffer(e.ARRAY_BUFFER,e._quadVBO),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0);let o=44;return e.bindBuffer(e.ARRAY_BUFFER,e._instanceVBO),e.enableVertexAttribArray(1),e.vertexAttribPointer(1,2,e.FLOAT,!1,o,0),e.vertexAttribDivisor(1,1),e.enableVertexAttribArray(2),e.vertexAttribPointer(2,1,e.FLOAT,!1,o,8),e.vertexAttribDivisor(2,1),e.enableVertexAttribArray(3),e.vertexAttribPointer(3,4,e.FLOAT,!1,o,12),e.vertexAttribDivisor(3,1),e.enableVertexAttribArray(4),e.vertexAttribPointer(4,4,e.FLOAT,!1,o,28),e.vertexAttribDivisor(4,1),e.bindVertexArray(null),t}var ot={};function at(e){if(ot[e])return ot[e];let t=parseInt(e.slice(1,3),16)/255,o=parseInt(e.slice(3,5),16)/255,n=parseInt(e.slice(5,7),16)/255,s=[t,o,n];return ot[e]=s,s}function Me(e,t){return t.sizeLog?Math.log2(e+1):e}var nt=new Float32Array(0),st=new Float32Array(0),rt=new Float32Array(0),it=new Float32Array(0),ve=new Float32Array(0);function we(e,t){return e.length>=t?e:new Float32Array(Math.max(t,e.length*2))}function Wo(e){return(e*2654435761>>>0&2147483647)/2147483648}function Do(e){return Math.min(5e3,Math.max(200,e*3))}function Uo(e){let t=e.renderZoom,o=e.W,n=e.H,s=e.currentLevel===se,r=e.selectedIds,i=r.size>0,a=e.hoveredId,l=Math.sqrt(o*o+n*n),c=l*1.2,h=c*c,d=l*.25,p=d*d,u=c-d,m,g,f,_,w,S,A;if(s)m=e.edges,g=e.nodes.length,f=E=>e.nodeIndexFull[E],_=E=>E.src,w=E=>E.dst,S=()=>1,A=E=>E;else{let E=e.getLevel(e.currentLevel);if(!E._snByBid){E._snByBid=new Map;for(let H of E.supernodes)E._snByBid.set(H.bid,H)}let F=E._snByBid;m=E.snEdges,g=E.supernodes.length,f=H=>F.get(H),_=H=>H.a,w=H=>H.b,S=H=>H.weight,A=H=>H}let x=Do(g),y=m.length>x?x/m.length:1;nt=we(nt,Math.min(m.length,x)*8);let v=nt,M=0,b=0,R=s?100/255:124/255,B=s?100/255:106/255,P=s?140/255:247/255,C=s?.25:.4;for(let E=0;E<m.length;E++){let F=m[E],H=f(_(F)),G=f(w(F));if(!H||!G)continue;let V=H.x*t+e.pan.x,q=H.y*t+e.pan.y,J=G.x*t+e.pan.x,k=G.y*t+e.pan.y,O=V-J,U=q-k,I=O*O+U*U;if(I>h||y<1&&Wo(E)>y*(2-I/h))continue;if(++b>x)break;let W=I<=p?1:Math.max(0,1-(Math.sqrt(I)-d)/u),Q=S(F),X=s?C*W:Math.min(C,.05+Q*.05)*W;if(X<.01)continue;let L=M*8;v[L]=V,v[L+1]=q,v[L+2]=J,v[L+3]=k,v[L+4]=R,v[L+5]=B,v[L+6]=P,v[L+7]=X,M++}if(i||a!==null){st=we(st,m.length*8);let E=st,F=0;for(let H=0;H<m.length;H++){let G=m[H],V=_(G),q=w(G),J=r.has(V)||V===a,k=r.has(q)||q===a;if(!J&&!k)continue;let O=f(V),U=f(q);if(!O||!U)continue;let I=O.x*t+e.pan.x,W=O.y*t+e.pan.y,Q=U.x*t+e.pan.x,X=U.y*t+e.pan.y,L=r.has(V)||r.has(q)?.3:.15,N=F*8;E[N]=I,E[N+1]=W,E[N+2]=Q,E[N+3]=X,E[N+4]=180/255,E[N+5]=180/255,E[N+6]=220/255,E[N+7]=L,F++}return{normalEdges:v.subarray(0,M*8),normalCount:M,hiliteEdges:E.subarray(0,F*8),hiliteCount:F}}return{normalEdges:v.subarray(0,M*8),normalCount:M,hiliteEdges:new Float32Array(0),hiliteCount:0}}function No(e){let t=e.renderZoom,o=e.W,n=e.H,s=e.currentLevel===se,r=e.selectedIds,i=e.hoveredId,a,l,c,h,d;if(s)a=e.nodes,l=Math.min(o,n)*t/256,c=v=>e._nodeColor(v),h=v=>v.id,d=v=>e.sizeBy==="edges"?v.degree:1;else{a=e.getLevel(e.currentLevel).supernodes;let M=1<<ne[e.currentLevel];l=Math.min(o,n)*t/M,c=b=>b.cachedColor,h=b=>b.bid,d=b=>e.sizeBy==="edges"?b.totalDegree:b.members.length}let p=s?Math.max(1,Math.min(l*.4,20)):Math.max(1.5,Math.min(l*.42,40)),u=s?1:1.5,m=s?1:1.2,g=e.pan.x+"|"+e.pan.y+"|"+t+"|"+e.sizeBy+"|"+e.sizeLog+"|"+e.currentLevel;if(e._glVisKey!==g){let v=0,M=1,b=l*.5;for(let R=0;R<a.length;R++){let B=a[R],P=B.x*t+e.pan.x,C=B.y*t+e.pan.y;if(P>=-b&&P<=o+b&&C>=-b&&C<=n+b){v++;let E=Me(d(B),e);E>M&&(M=E)}}e._glVisKey=g,e._glVisCount=v,e._glMaxSize=M}let f=e._glVisCount,_=e._glMaxSize;rt=we(rt,a.length*11);let w=rt,S=r.size+(i!==null?1:0);it=we(it,Math.max(1,S)*11);let A=it,x=0,y=0;for(let v=0;v<a.length;v++){let M=a[v],b=M.x*t+e.pan.x,R=M.y*t+e.pan.y;if(b<-p||b>o+p||R<-p||R>n+p)continue;let B=d(M),P=Me(B,e),C=Math.max(u,Math.min(p,u+Math.sqrt(P)*m)),E=c(M),F=at(E),H=h(M),G=r.has(H),V=i===H,q=f>50?.3+.7*Math.sqrt(P/_):1,J,k;s?(J=G?1:V?.8:187/255,k=G?1:0):(J=G?1:V?.8:q*153/255,k=G||V?1:q);let O=x*11;if(w[O]=b,w[O+1]=R,w[O+2]=C,w[O+3]=F[0],w[O+4]=F[1],w[O+5]=F[2],w[O+6]=J,w[O+7]=G?1:F[0],w[O+8]=G?1:F[1],w[O+9]=G?1:F[2],w[O+10]=k,x++,G||V){let U=C*(s?3:2.5),I=y*11;A[I]=b,A[I+1]=R,A[I+2]=U,A[I+3]=F[0],A[I+4]=F[1],A[I+5]=F[2],A[I+6]=G?.27:.2,A[I+7]=0,A[I+8]=0,A[I+9]=0,A[I+10]=0,y++}}return{circles:w.subarray(0,x*11),circleCount:x,glows:A.subarray(0,y*11),glowCount:y}}function Vo(e){let t=e.renderZoom,o=e.W,n=e.H,s=e.currentLevel===se,r=s?e.nodes:e.getLevel(e.currentLevel).supernodes,i=4,a=Math.ceil(o/i),l=Math.ceil(n/i),c=Math.max(8,Math.min(40,Math.min(a,l)/8));ve=we(ve,r.length*11);let h=ve,d=0;for(let p=0;p<r.length;p++){let u=r[p],m=u.x*t+e.pan.x,g=u.y*t+e.pan.y,f=m/i,_=g/i;if(f<-c||f>a+c||_<-c||_>l+c)continue;let w;s?w=Me(e.sizeBy==="edges"?u.degree+1:1,e):w=Me(e.sizeBy==="edges"?u.totalDegree+1:u.members.length,e);let S=s?e._nodeColor(u):u.cachedColor,A=at(S),x=d*11;h[x]=f,h[x+1]=_,h[x+2]=c,h[x+3]=A[0],h[x+4]=A[1],h[x+5]=A[2],h[x+6]=w,h[x+7]=0,h[x+8]=0,h[x+9]=0,h[x+10]=0,d++}return{data:h.subarray(0,d*11),count:d,gw:a,gh:l,kernelR:c}}var pe=null;function jo(e,t,o,n,s){let r=s*s,i=o*n;(!pe||pe.length<i)&&(pe=new Float32Array(Math.max(i,1))),pe.fill(0,0,i);for(let l=0;l<t;l++){let c=l*11,h=e[c],d=e[c+1],p=e[c+6],u=Math.max(0,h-s|0),m=Math.min(o-1,h+s+1|0),g=Math.max(0,d-s|0),f=Math.min(n-1,d+s+1|0);for(let _=g;_<=f;_++){let w=_-d,S=w*w,A=_*o;for(let x=u;x<=m;x++){let y=x-h,v=y*y+S;if(v>r)continue;let M=1-v/r;pe[A+x]+=M*M*p}}}let a=0;for(let l=0;l<i;l++)pe[l]>a&&(a=pe[l]);return a}function qo(e){return e.currentLevel+"|"+e.renderZoom.toFixed(1)+"|"+e.sizeBy+"|"+e.sizeLog+"|"+e.W+"|"+e.H+"|"+(e._blendGen||0)}function Yo(e,t){let o=t.W,n=t.H;if(Go(e,o,n),e._heatFBOBroken)return;let s=e._heatW,r=e._heatH,{data:i,count:a,gw:l,gh:c,kernelR:h}=Vo(t);if(a===0)return;e.bindFramebuffer(e.FRAMEBUFFER,e._heatFBO),e.viewport(0,0,s,r),e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT),e.enable(e.BLEND),e.blendFunc(e.ONE,e.ONE),e.useProgram(e._heatSplatProg),e.uniform2f(e._heatSplatProg.u_resolution,l,c),e.bindVertexArray(e._circleVAO),e.bindBuffer(e.ARRAY_BUFFER,e._instanceVBO),e.bufferData(e.ARRAY_BUFFER,i,e.DYNAMIC_DRAW),e.drawArraysInstanced(e.TRIANGLE_STRIP,0,4,a),e.bindFramebuffer(e.FRAMEBUFFER,null);let d=qo(t);if(d!==e._heatMaxWKey){let m=jo(i,a,l,c,h);e._heatMaxWTarget=m||1,e._heatMaxWKey=d,e._heatMaxWTime=performance.now(),e._heatMaxW===0&&(e._heatMaxW=e._heatMaxWTarget)}let p=performance.now()-e._heatMaxWTime,u=1-Math.exp(-p/200);if(e._heatMaxW+=(e._heatMaxWTarget-e._heatMaxW)*u,e._heatMaxWTime=performance.now(),e._heatMaxW<.001){e.viewport(0,0,o,n);return}e.viewport(0,0,o,n),e.blendFunc(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA),e.useProgram(e._heatResolveProg),e.uniform1i(e._heatResolveProg.u_density,0),e.uniform1f(e._heatResolveProg.u_maxW,e._heatMaxW),e.uniform1f(e._heatResolveProg.u_lightMode,t._lightMode?1:0),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,e._heatTex),e.bindVertexArray(e._heatResolveVAO),e.drawArrays(e.TRIANGLE_STRIP,0,4),e.disable(e.BLEND),Math.abs(e._heatMaxW-e._heatMaxWTarget)>e._heatMaxWTarget*.01&&t.render()}function Zo(e){let t=e.renderZoom,o=e.W,n=e.H,s=e.currentLevel===se,r=s?e.nodes:e.getLevel(e.currentLevel).supernodes;ve=we(ve,r.length*11);let i=ve,a=0;for(let l=0;l<r.length;l++){let c=r[l],h=c.x*t+e.pan.x,d=c.y*t+e.pan.y,p=s?200:400;if(h<-p||h>o+p||d<-p||d>n+p)continue;let u;s?u=Me(e.sizeBy==="edges"?c.degree+1:1,e):u=Me(e.sizeBy==="edges"?c.totalDegree+1:c.members.length,e);let m=Math.max(50,Math.min(p,50+Math.sqrt(u)*25)),g=s?e._nodeColor(c):c.cachedColor,f=at(g),_=a*11;i[_]=h,i[_+1]=d,i[_+2]=m,i[_+3]=f[0],i[_+4]=f[1],i[_+5]=f[2],i[_+6]=e._lightMode?.3:.15,i[_+7]=0,i[_+8]=0,i[_+9]=0,i[_+10]=0,a++}return{data:i.subarray(0,a*11),count:a}}function Ko(e,t){let o=t.W,n=t.H,{data:s,count:r}=Zo(t);if(r===0)return;e.enable(e.BLEND),t._lightMode?e.blendFunc(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA):e.blendFunc(e.SRC_ALPHA,e.ONE);let i=e._circleProgram._glow;e.useProgram(i),e.uniform2f(i.u_resolution,o,n),e.bindVertexArray(e._circleVAO),e.bindBuffer(e.ARRAY_BUFFER,e._instanceVBO),e.bufferData(e.ARRAY_BUFFER,s,e.DYNAMIC_DRAW),e.drawArraysInstanced(e.TRIANGLE_STRIP,0,4,r),e.blendFunc(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA),e.disable(e.BLEND)}function Rt(e,t){let o=t.W,n=t.H;if(o<=0||n<=0)return;e.viewport(0,0,o,n),e._clearR!==void 0?e.clearColor(e._clearR,e._clearG,e._clearB,1):e.clearColor(10/255,10/255,15/255,1),e.clear(e.COLOR_BUFFER_BIT),e.enable(e.BLEND),e.blendFunc(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA);let s=40*t.renderZoom;if(s>=4&&(e.useProgram(e._gridProgram),e.uniform2f(e._gridProgram.u_resolution,o,n),e.uniform1f(e._gridProgram.u_gridSize,s),e.uniform2f(e._gridProgram.u_pan,t.pan.x%s,t.pan.y%s),e.uniform1f(e._gridProgram.u_lightMode,t._lightMode?1:0),e.bindVertexArray(e._heatResolveVAO),e.drawArrays(e.TRIANGLE_STRIP,0,4)),!t.nodes||t.nodes.length===0){e.disable(e.BLEND);return}let r=t.edgeMode!=="none"?Uo(t):null,i=t.edgeMode==="curves",a=i?e._edgeCurveProgram:e._edgeLineProgram,l=i?e._edgeCurveVAO:e._edgeLineVAO,c=i?(e._curveSegCount+1)*2:4;r&&r.normalCount>0&&(e.useProgram(a),e.uniform2f(a.u_resolution,o,n),e.uniform1f(a.u_width,1),e.bindVertexArray(l),e.bindBuffer(e.ARRAY_BUFFER,e._instanceVBO),e.bufferData(e.ARRAY_BUFFER,r.normalEdges,e.DYNAMIC_DRAW),e.drawArraysInstanced(e.TRIANGLE_STRIP,0,c,r.normalCount)),t.heatmapMode==="density"?(Yo(e,t),e.enable(e.BLEND),e.blendFunc(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA)):t.heatmapMode==="splat"&&(Ko(e,t),e.enable(e.BLEND),e.blendFunc(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA)),r&&r.hiliteCount>0&&(e.useProgram(a),e.uniform2f(a.u_resolution,o,n),e.uniform1f(a.u_width,2),e.bindVertexArray(l),e.bindBuffer(e.ARRAY_BUFFER,e._instanceVBO),e.bufferData(e.ARRAY_BUFFER,r.hiliteEdges,e.DYNAMIC_DRAW),e.drawArraysInstanced(e.TRIANGLE_STRIP,0,c,r.hiliteCount));let{circles:h,circleCount:d,glows:p,glowCount:u}=No(t);if(d>0){if(u>0){let m=e._circleProgram._glow;e.useProgram(m),e.uniform2f(m.u_resolution,o,n),e.bindVertexArray(e._circleVAO),e.bindBuffer(e.ARRAY_BUFFER,e._instanceVBO),e.bufferData(e.ARRAY_BUFFER,p,e.DYNAMIC_DRAW),e.drawArraysInstanced(e.TRIANGLE_STRIP,0,4,u)}e.useProgram(e._circleProgram),e.uniform2f(e._circleProgram.u_resolution,o,n),e.bindVertexArray(e._circleVAO),e.bindBuffer(e.ARRAY_BUFFER,e._instanceVBO),e.bufferData(e.ARRAY_BUFFER,h,e.DYNAMIC_DRAW),e.drawArraysInstanced(e.TRIANGLE_STRIP,0,4,d)}e.disable(e.BLEND),e.bindVertexArray(null)}var Pt={dark:{grid:"rgba(60,60,100,0.6)",labelBright:"#fff",labelHover:"rgba(230,230,255,0.95)",labelNeighbor:"rgba(210,210,245,0.8)",labelDim:"rgba(220,220,255,0.85)",labelRawDim:"rgba(200,200,220,0.75)",countFill:"#ffffffcc",shadowColor:"rgba(0,0,0,0.9)",shadowNeighbor:"rgba(0,0,0,0.85)",legendBg:"rgba(10, 10, 15, 0.75)",legendText:"#c8c8d8",legendOverflow:"#8888a0",resetBg:"rgba(10, 10, 15, 0.65)",resetText:"#8888a0",fpsFill:"rgba(200,200,220,0.6)"},light:{grid:"rgba(100,100,140,0.25)",labelBright:"#111",labelHover:"rgba(30,30,60,0.9)",labelNeighbor:"rgba(40,40,80,0.75)",labelDim:"rgba(50,50,80,0.8)",labelRawDim:"rgba(60,60,90,0.7)",countFill:"rgba(20,20,40,0.85)",shadowColor:"rgba(255,255,255,0.9)",shadowNeighbor:"rgba(255,255,255,0.85)",legendBg:"rgba(255, 255, 255, 0.85)",legendText:"#333340",legendOverflow:"#6a6a80",resetBg:"rgba(255, 255, 255, 0.75)",resetText:"#6a6a80",fpsFill:"rgba(60,60,80,0.6)"}};function oe(e){return e._lightMode?Pt.light:Pt.dark}function Ft(e){return Math.min(5e3,Math.max(200,e*3))}var ct={};function Ht(e){if(ct[e])return ct[e];let t=parseInt(e.slice(1,3),16),o=parseInt(e.slice(3,5),16),n=parseInt(e.slice(5,7),16),s={r:t,g:o,b:n};return ct[e]=s,s}var lt={};function Ee(e,t){let o=t?-e:e;if(lt[o])return lt[o];let n=t?`bold ${e}px JetBrains Mono`:`${e}px JetBrains Mono`;return lt[o]=n,n}var Ot=new Array(256);for(let e=0;e<256;e++)Ot[e]=e.toString(16).padStart(2,"0");var ut={};function le(e,t,o,n){let s=(e<<24|t<<16|o<<8|n*255|0)>>>0;if(ut[s])return ut[s];let r=`rgba(${e},${t},${o},${n})`;return ut[s]=r,r}function Gt(e){return(e*2654435761>>>0&2147483647)/2147483648}function me(e,t){return t.sizeLog?Math.log2(e+1):e}var Ne="curves";function ht(e){Ne=e}function Ve(e,t,o,n,s){if(Ne==="lines"){e.moveTo(t,o),e.lineTo(n,s);return}let r=n-t,i=s-o,a=Math.sqrt(r*r+i*i);if(a<1){e.moveTo(t,o),e.lineTo(n,s);return}let l=-i/a,c=r/a,h=t+r*.3+l*a*.15,d=o+i*.3+c*a*.15,p=t+r*.7+l*a*.05,u=o+i*.7+c*a*.05;e.moveTo(t,o),e.bezierCurveTo(h,d,p,u,n,s)}function kt(e,t,o){return{x:t*e.renderZoom+e.pan.x,y:o*e.renderZoom+e.pan.y}}function Wt(e,t,o){return{x:(t-e.pan.x)/e.renderZoom,y:(o-e.pan.y)/e.renderZoom}}function Dt(e){let t=e.currentLevel===se,o=t?e.nodes:e.getLevel(e.currentLevel).supernodes;if(o.length===0)return;let n=1/0,s=-1/0,r=1/0,i=-1/0;for(let g=0;g<o.length;g++){let f=o[g],_=f.ax!==void 0?f.ax:f.px,w=f.ay!==void 0?f.ay:f.py;_<n&&(n=_),_>s&&(s=_),w<r&&(r=w),w>i&&(i=w)}n<-3&&(n=-3),s>3&&(s=3),r<-3&&(r=-3),i>3&&(i=3);let a=s-n||1,l=i-r||1,c=Math.max(40,Math.min(100,Math.min(e.W,e.H)*.08)),h=e.W-c*2,d=e.H-c*2,p=Math.min(h/a,d/l),u=c+(h-a*p)/2,m=c+(d-l*p)/2;if(e._layoutScale=p,e._layoutOffX=u,e._layoutOffY=m,e._layoutMinX=n,e._layoutMinY=r,t)for(let g=0;g<e.nodes.length;g++){let f=e.nodes[g],_=Math.max(n,Math.min(s,f.px)),w=Math.max(r,Math.min(i,f.py));f.x=u+(_-n)*p,f.y=m+(w-r)*p}else{let g=e.getLevel(e.currentLevel).supernodes;for(let f=0;f<g.length;f++){let _=g[f],w=Math.max(n,Math.min(s,_.ax)),S=Math.max(r,Math.min(i,_.ay));_.x=u+(w-n)*p,_.y=m+(S-r)*p}}}function je(e){let t=e.ctx,o=e.W,n=e.H;t.clearRect(0,0,o,n);let s=!!e._gl,i=e.currentLevel===se?$o:Xo;if(!s){t.strokeStyle=oe(e).grid,t.lineWidth=.5;let a=40*e.renderZoom;if(a>=4){let c=e.pan.x%a,h=e.pan.y%a;t.beginPath();for(let d=c;d<o;d+=a)t.moveTo(d,0),t.lineTo(d,n);for(let d=h;d<n;d+=a)t.moveTo(0,d),t.lineTo(o,d);t.stroke()}ht(e.edgeMode),e.edgeMode!=="none"&&i(e,"edges"),e.heatmapMode==="splat"?Qo(e):e.heatmapMode==="density"&&en(e);let l=Ne;Ne==="none"&&ht("lines"),i(e,"hilite"),ht(l),i(e,"circles")}i(e,"labels"),e.showLegend&&tn(e),e.showResetBtn&&on(e)}function Xo(e,t){let o=e.ctx,n=e.getLevel(e.currentLevel),{supernodes:s,snEdges:r}=n;if(!n._snByBid){n._snByBid=new Map;for(let x of s)n._snByBid.set(x.bid,x)}let i=n._snByBid,a=Math.sqrt(e.W*e.W+e.H*e.H),l=a*1.2,c=l*l,h=a*.25,d=l-h,p=e.renderZoom,u=e.selectedIds,m=u.size>0,g=e.hoveredId;if(t==="edges"){let x=Ft(s.length),y=r.length>x?x/r.length:1,v=0,M=10,b=new Array(M);for(let B=0;B<M;B++)b[B]=[];let R=h*h;for(let B=0;B<r.length;B++){let P=r[B],C=i.get(P.a),E=i.get(P.b);if(!C||!E)continue;let F=C.x*p+e.pan.x,H=C.y*p+e.pan.y,G=E.x*p+e.pan.x,V=E.y*p+e.pan.y,q=F-G,J=H-V,k=q*q+J*J;if(k>c||y<1&&Gt(B)>y*(2-k/c))continue;if(++v>x)break;let O=k<=R?1:Math.max(0,1-(Math.sqrt(k)-h)/d),U=Math.min(.4,.05+P.weight*.05)*O;if(U<.01)continue;let I=Math.min(M-1,U/.4*M|0);b[I].push(F,H,G,V)}for(let B=0;B<M;B++){let P=b[B];if(P.length===0)continue;let C=((B+.5)/M*40|0)/100;o.strokeStyle=le(124,106,247,C),o.lineWidth=1,o.beginPath();for(let E=0;E<P.length;E+=4)Ve(o,P[E],P[E+1],P[E+2],P[E+3]);o.stroke()}return}let f=1<<ne[e.currentLevel],_=Math.min(e.W,e.H)*p/f;if(t==="hilite"){if(m||g!==null)for(let x=0;x<r.length;x++){let y=r[x],v=u.has(y.a)||y.a===g,M=u.has(y.b)||y.b===g;if(!v&&!M)continue;let b=i.get(y.a),R=i.get(y.b);if(!b||!R)continue;let B=b.x*p+e.pan.x,P=b.y*p+e.pan.y,C=R.x*p+e.pan.x,E=R.y*p+e.pan.y;o.strokeStyle=u.has(y.a)||u.has(y.b)?"rgba(180,180,220,0.3)":"rgba(180,180,220,0.15)",o.lineWidth=Math.min(4,1+y.weight*.4),o.beginPath(),Ve(o,B,P,C,E),o.stroke()}return}let w=e.pan.x+"|"+e.pan.y+"|"+p+"|"+e.sizeBy+"|"+e.sizeLog;if(n._visKey!==w){let x=0,y=1,v=_*.5;for(let M=0;M<s.length;M++){let b=s[M],R=b.x*p+e.pan.x,B=b.y*p+e.pan.y;if(R>=-v&&R<=e.W+v&&B>=-v&&B<=e.H+v){x++;let P=me(e.sizeBy==="edges"?b.totalDegree:b.members.length,e);P>y&&(y=P)}}n._visKey=w,n._visibleCount=x,n._maxSizeVal=y}let S=n._visibleCount,A=n._maxSizeVal;for(let x=0;x<s.length;x++){let y=s[x],v=y.x*p+e.pan.x,M=y.y*p+e.pan.y,b=Math.max(1.5,Math.min(_*.42,40));if(v<-b||v>e.W+b||M<-b||M>e.H+b)continue;let R=e.sizeBy==="edges"?y.totalDegree:y.members.length,B=me(R,e),P=Math.max(1.5,Math.min(b,1.5+Math.sqrt(B)*1.2)),C=y.cachedColor,E=u.has(y.bid),F=g===y.bid,H=S>50?.3+.7*Math.sqrt(B/A):1;if(t==="circles"){if(E||F){let G=o.createRadialGradient(v,M,0,v,M,P*2.5);G.addColorStop(0,C+"44"),G.addColorStop(1,C+"00"),o.fillStyle=G,o.beginPath(),o.arc(v,M,P*2.5,0,Math.PI*2),o.fill()}o.fillStyle=C+(E?"ff":F?"cc":Ot[Math.round(H*153)]),o.beginPath(),o.arc(v,M,P,0,Math.PI*2),o.fill(),o.strokeStyle=E?"#fff":C,o.lineWidth=E?2:1,o.globalAlpha=E||F?1:H,o.stroke(),o.globalAlpha=1}if(t==="labels"){if(!n._hlNeighbors||n._hlKey!==""+[...u]+"|"+g){let k=Math.max(5,Math.min(20,Math.floor(Math.min(e.W,e.H)/40))),O=[];if(m||g!==null)for(let I=0;I<r.length;I++){let W=r[I];(u.has(W.a)||W.a===g)&&O.push({id:W.b,w:W.weight}),(u.has(W.b)||W.b===g)&&O.push({id:W.a,w:W.weight})}O.sort((I,W)=>W.w-I.w);let U=new Set;for(let I=0;I<Math.min(O.length,k);I++)U.add(O[I].id);n._hlNeighbors=U,n._hlKey=""+[...u]+"|"+g}let V=n._hlNeighbors.has(y.bid)&&H>.5;if((E||F)&&_>=10&&P>=3){let k=Math.max(7,Math.min(13,P*1))|0;o.fillStyle=oe(e).countFill,o.font=Ee(k,!0),o.textAlign="center",o.textBaseline="middle",o.fillText(R,v,M)}if(E||F||V||S<=50&&_>=20||S<=150&&H>.7&&_>=20){let k=y.cachedLabel,O=k.split(" \xB7 "),U=O.length>1&&e.labelProps.has("label");if(E||F){let I=Math.max(11,Math.min(12,_*.18))|0;o.font=Ee(I,!0),o.textAlign="center",o.shadowColor=oe(e).shadowColor,o.shadowBlur=10,o.fillStyle=E?oe(e).labelBright:oe(e).labelHover,U?(o.textBaseline="bottom",o.fillText(O[0],v,M-P-3),o.textBaseline="top",o.fillText(O.slice(1).join(" \xB7 "),v,M+P+3)):(o.textBaseline="bottom",o.fillText(k,v,M-P-3)),o.shadowBlur=0}else if(V){let I=Math.max(10,Math.min(12,_*.18))|0,W=20;if(o.font=Ee(I,!1),o.textAlign="center",o.shadowColor=oe(e).shadowNeighbor,o.shadowBlur=10,o.fillStyle=oe(e).labelNeighbor,U){let Q=O[0].length>W?O[0].slice(0,W-1)+"\u2026":O[0];o.textBaseline="bottom",o.fillText(Q,v,M-P-3);let X=O.slice(1).join(" \xB7 "),L=X.length>W?X.slice(0,W-1)+"\u2026":X;o.textBaseline="top",o.fillText(L,v,M+P+3)}else{let Q=k.length>W?k.slice(0,W-1)+"\u2026":k;o.textBaseline="bottom",o.fillText(Q,v,M-P-3)}o.shadowBlur=0}else{let I=Math.max(10,Math.min(13,_*.18))|0,W=I*.6,Q=Math.max(3,_/W|0);if(o.fillStyle=oe(e).labelDim,o.font=Ee(I,!1),o.textAlign="center",U){let X=O[0].length>Q?O[0].slice(0,Q-1)+"\u2026":O[0];o.textBaseline="bottom",o.fillText(X,v,M-P-3);let L=O.slice(1).join(" \xB7 "),N=L.length>Q?L.slice(0,Q-1)+"\u2026":L;o.textBaseline="top",o.fillText(N,v,M+P+3)}else{let X=k.length>Q?k.slice(0,Q-1)+"\u2026":k;o.textBaseline="bottom",o.fillText(X,v,M-P-3)}}}}}}function $o(e,t){let o=e.ctx,n=e.renderZoom,s=Math.min(e.W,e.H)*n/256,r=Math.sqrt(e.W*e.W+e.H*e.H),i=r*1.2,a=i*i,l=r*.25,c=i-l,h=e.selectedIds,d=h.size>0,p=e.hoveredId;if(t==="edges"){let u=Ft(e.nodes.length),m=e.edges.length>u?u/e.edges.length:1,g=0,f=10,_=new Array(f);for(let S=0;S<f;S++)_[S]=[];let w=l*l;for(let S=0;S<e.edges.length;S++){let A=e.edges[S],x=e.nodeIndexFull[A.src],y=e.nodeIndexFull[A.dst];if(!x||!y)continue;let v=x.x*n+e.pan.x,M=x.y*n+e.pan.y,b=y.x*n+e.pan.x,R=y.y*n+e.pan.y,B=v-b,P=M-R,C=B*B+P*P;if(C>a||m<1&&Gt(S)>m*(2-C/a))continue;if(++g>u)break;let F=.25*(C<=w?1:Math.max(0,1-(Math.sqrt(C)-l)/c));if(F<.01)continue;let H=Math.min(f-1,F/.25*f|0);_[H].push(v,M,b,R)}o.lineWidth=.8;for(let S=0;S<f;S++){let A=_[S];if(A.length===0)continue;let x=((S+.5)/f*25|0)/100;o.strokeStyle=le(100,100,140,x),o.beginPath();for(let y=0;y<A.length;y+=4)Ve(o,A[y],A[y+1],A[y+2],A[y+3]);o.stroke()}return}if(t==="hilite"){if(d||p!==null)for(let u=0;u<e.edges.length;u++){let m=e.edges[u],g=h.has(m.src)||m.src===p,f=h.has(m.dst)||m.dst===p;if(!g&&!f)continue;let _=e.nodeIndexFull[m.src],w=e.nodeIndexFull[m.dst];if(!_||!w)continue;let S=_.x*n+e.pan.x,A=_.y*n+e.pan.y,x=w.x*n+e.pan.x,y=w.y*n+e.pan.y;o.strokeStyle=h.has(m.src)||h.has(m.dst)?"rgba(180,180,220,0.3)":"rgba(180,180,220,0.15)",o.lineWidth=h.has(m.src)||h.has(m.dst)?1.5:1,o.beginPath(),Ve(o,S,A,x,y),o.stroke()}return}for(let u=0;u<e.nodes.length;u++){let m=e.nodes[u],g=m.x*n+e.pan.x,f=m.y*n+e.pan.y,_=Math.max(1,Math.min(s*.4,20));if(g<-_||g>e.W+_||f<-_||f>e.H+_)continue;let w=me(e.sizeBy==="edges"?m.degree:1,e),S=Math.max(1,Math.min(_,1+Math.sqrt(w)*1)),A=e._nodeColor(m),x=h.has(m.id),y=p===m.id;if(t==="circles"){if(x||y){let v=o.createRadialGradient(g,f,0,g,f,S*3);v.addColorStop(0,A+"66"),v.addColorStop(1,A+"00"),o.fillStyle=v,o.beginPath(),o.arc(g,f,S*3,0,Math.PI*2),o.fill()}o.fillStyle=A+(x?"ff":"bb"),o.beginPath(),o.arc(g,f,S,0,Math.PI*2),o.fill(),x&&(o.strokeStyle="#fff",o.lineWidth=1.5,o.stroke())}if(t==="labels"){if(!e._rawHlNeighbors||e._rawHlKey!==""+[...h]+"|"+p){let b=Math.max(5,Math.min(20,Math.floor(Math.min(e.W,e.H)/40))),R={};if(d||p!==null)for(let C=0;C<e.edges.length;C++){let E=e.edges[C];(h.has(E.src)||E.src===p)&&(R[E.dst]=(R[E.dst]||0)+1),(h.has(E.dst)||E.dst===p)&&(R[E.src]=(R[E.src]||0)+1)}let B=Object.keys(R).sort((C,E)=>R[E]-R[C]),P=new Set(B.slice(0,b));e._rawHlNeighbors=P,e._rawHlKey=""+[...h]+"|"+p}let M=e._rawHlNeighbors.has(m.id)&&m.degree>=3;if(x||y||M||s>=14){let b=e._nodeLabel(m);if(x||y){let R=Math.max(11,Math.min(12,s*.22))|0;o.fillStyle=x?"#fff":"rgba(230,230,255,0.95)",o.font=Ee(R,!0),o.textAlign="left",o.textBaseline="middle",o.fillText(b,g+S+3,f)}else{let R=Math.max(10,Math.min(13,s*.22))|0,B=R*.6,P=Math.max(4,s*.8/B|0),C=b.length>P?b.slice(0,P-1)+"\u2026":b;o.fillStyle=oe(e).labelRawDim,o.font=Ee(R,!1),o.textAlign="left",o.textBaseline="middle",o.fillText(C,g+S+3,f)}}}}}function Qo(e){let t=e.ctx,o=e.W,n=e.H,s=e.renderZoom,r=e.currentLevel===se,i=r?e.nodes:e.getLevel(e.currentLevel).supernodes,a=e._lightMode;t.save(),a?(t.globalCompositeOperation="source-over",t.globalAlpha=.5):(t.globalCompositeOperation="lighter",t.globalAlpha=.6);for(let l=0;l<i.length;l++){let c=i[l],h=c.x*s+e.pan.x,d=c.y*s+e.pan.y,p=r?200:400;if(h<-p||h>o+p||d<-p||d>n+p)continue;let u;r?u=me(e.sizeBy==="edges"?c.degree+1:1,e):u=me(e.sizeBy==="edges"?c.totalDegree+1:c.members.length,e);let m=Math.max(50,Math.min(p,50+Math.sqrt(u)*25)),g=r?e._nodeColor(c):c.cachedColor,f=Ht(g),_=t.createRadialGradient(h,d,0,h,d,m);a?(_.addColorStop(0,le(f.r,f.g,f.b,.4)),_.addColorStop(.5,le(f.r,f.g,f.b,.15)),_.addColorStop(1,le(f.r,f.g,f.b,0))):(_.addColorStop(0,le(f.r,f.g,f.b,.25)),_.addColorStop(.5,le(f.r,f.g,f.b,.08)),_.addColorStop(1,le(f.r,f.g,f.b,0))),t.fillStyle=_,t.beginPath(),t.arc(h,d,m,0,Math.PI*2),t.fill()}t.restore()}var Bt=0,Ct=0,ke=null,We=null,De=null,Se=null,ft=null,dt=null,ge=0,Ue=0,Tt="",pt=0,Jo=0,It=0;function zo(e){return e._densityId||(e._densityId=++Jo),e._densityId+"|"+e.currentLevel+"|"+e.renderZoom.toFixed(1)+"|"+e.sizeBy+"|"+e.sizeLog+"|"+e.W+"|"+e.H}function en(e){let t=e.W,o=e.H,n=e.renderZoom,s=e.currentLevel===se,r=s?e.nodes:e.getLevel(e.currentLevel).supernodes,i=4,a=Math.ceil(t/i),l=Math.ceil(o/i),c=a*l;(a!==Bt||l!==Ct)&&(Bt=a,Ct=l,ke=new Float32Array(c),We=new Float32Array(c),De=new Float32Array(c),Se=new Float32Array(c),ft=new ImageData(a,l),dt=new OffscreenCanvas(a,l)),ke.fill(0),We.fill(0),De.fill(0),Se.fill(0);let h=Math.max(8,Math.min(40,Math.min(a,l)/8)),d=h*h,p=zo(e),u=p!==Tt;for(let A=0;A<r.length;A++){let x=r[A],y=(x.x*n+e.pan.x)/i,v=(x.y*n+e.pan.y)/i;if(y<-h||y>a+h||v<-h||v>l+h)continue;let M;s?M=me(e.sizeBy==="edges"?x.degree+1:1,e):M=me(e.sizeBy==="edges"?x.totalDegree+1:x.members.length,e);let b=s?e._nodeColor(x):x.cachedColor,R=Ht(b),B=Math.max(0,y-h|0),P=Math.min(a-1,y+h+1|0),C=Math.max(0,v-h|0),E=Math.min(l-1,v+h+1|0);for(let F=C;F<=E;F++){let H=F-v,G=H*H,V=F*a;for(let q=B;q<=P;q++){let J=q-y,k=J*J+G;if(k>d)continue;let O=1-k/d,U=O*O*M,I=V+q;ke[I]+=R.r*U,We[I]+=R.g*U,De[I]+=R.b*U,Se[I]+=U}}}if(u){let A=0;for(let y=0;y<c;y++)Se[y]>A&&(A=Se[y]);Ue=A,Tt=p,pt=performance.now();let x=e._densityId!==It;It=e._densityId,(ge===0||x)&&(ge=A)}let m=performance.now()-pt,g=1-Math.exp(-m/200);if(ge+=(Ue-ge)*g,pt=performance.now(),ge<.001)return;let f=ft.data,_=1/(ge*.3),w=e._lightMode;for(let A=0;A<c;A++){let x=Se[A];if(x<.001){f[A*4+3]=0;continue}let y=Math.min(1,x*_),v=y/x,M=A*4,b=Math.min(255,ke[A]*v+.5|0),R=Math.min(255,We[A]*v+.5|0),B=Math.min(255,De[A]*v+.5|0);w?(f[M]=255-(255-b)*y+.5|0,f[M+1]=255-(255-R)*y+.5|0,f[M+2]=255-(255-B)*y+.5|0,f[M+3]=Math.min(255,y*220+.5|0)):(f[M]=b,f[M+1]=R,f[M+2]=B,f[M+3]=Math.min(255,y*180+.5|0))}dt.getContext("2d").putImageData(ft,0,0),e.ctx.save(),e.ctx.imageSmoothingEnabled=!0,e.ctx.imageSmoothingQuality="high",e.ctx.drawImage(dt,0,0,t,o),e.ctx.restore(),Math.abs(ge-Ue)>Ue*.01&&e.render()}function tn(e){let t=e._cachedColorMap;if(!t)return;let o=Object.entries(t);if(o.length===0)return;let n=e.currentLevel===se,s=n?e.nodes:e.getLevel(e.currentLevel).supernodes,r={};for(let v of s){let M=n?e._nodeColorVal(v):v.cachedColorVal||"";r[M]=(r[M]||0)+1}o.sort((v,M)=>(r[M[0]]||0)-(r[v[0]]||0));let a=o.slice(0,12),l=o.length-a.length,c=e.ctx,h=10,d=4,p=16,u=8,m=90;c.font=`${h}px JetBrains Mono, monospace`;let g=0;for(let[v]of a){let M=c.measureText(v.length>14?v.slice(0,13)+"\u2026":v).width;M>g&&(g=M)}g=Math.min(g,m);let f=a.length+(l>0?1:0),_=d*2+6+g+u*2,w=f*p+u*2,S=8,A=e.showLegend||1,x=A===2||A===3?S:e.W-_-S,y=A===3||A===4?S:e.H-w-S;c.fillStyle=oe(e).legendBg,c.beginPath(),c.roundRect(x,y,_,w,4),c.fill();for(let v=0;v<a.length;v++){let[M,b]=a[v],R=y+u+v*p+p/2;c.fillStyle=b,c.beginPath(),c.arc(x+u+d,R,d,0,Math.PI*2),c.fill(),c.fillStyle=oe(e).legendText,c.textAlign="left",c.textBaseline="middle";let B=M.length>14?M.slice(0,13)+"\u2026":M;c.fillText(B,x+u+d*2+6,R)}if(l>0){let v=y+u+a.length*p+p/2;c.fillStyle=oe(e).legendOverflow,c.textAlign="left",c.textBaseline="middle",c.fillText(`+${l} more`,x+u,v)}}function on(e){let t=e._resetBtnRect();if(!t)return;let o=e.ctx;o.fillStyle=oe(e).resetBg,o.beginPath(),o.roundRect(t.x,t.y,t.w,t.h,4),o.fill(),o.fillStyle=oe(e).resetText,o.font="14px JetBrains Mono, monospace",o.textAlign="center",o.textBaseline="middle",o.fillText("\u21BA",t.x+t.w/2,t.y+t.h/2)}function Ut(e,t,o){let n=e.renderZoom,s=(t-e.pan.x)/n,r=(o-e.pan.y)/n;if(e.currentLevel===se){let i=Math.min(e.W,e.H)*n/256,l=(Math.max(8,Math.min(10,i*.42))+4)/n,c=l*l,h=5,d=ne[h],p=e._layoutScale;if(p&&e.nodes.length>500){let u=(s-e._layoutOffX)/p+e._layoutMinX,m=(r-e._layoutOffY)/p+e._layoutMinY,g=Math.max(0,Math.min(z-1,Math.floor((u+1)/2*z))),f=Math.max(0,Math.min(z-1,Math.floor((m+1)/2*z))),_=Le-d,w=g>>_,S=f>>_,A=1<<d,x=e.getLevel(h);if(!x._snByBid){x._snByBid=new Map;for(let y of x.supernodes)x._snByBid.set(y.bid,y)}for(let y=-1;y<=1;y++){let v=S+y;if(!(v<0||v>=A))for(let M=-1;M<=1;M++){let b=w+M;if(b<0||b>=A)continue;let R=b<<d|v,B=x._snByBid.get(R);if(B)for(let P of B.members){let C=P.x-s,E=P.y-r;if(C*C+E*E<c)return{type:"node",item:P}}}}}else for(let u=0;u<e.nodes.length;u++){let m=e.nodes[u],g=m.x-s,f=m.y-r;if(g*g+f*f<c)return{type:"node",item:m}}}else{let i=ne[e.currentLevel],a=1<<i,l=Math.min(e.W,e.H)*n/a,h=(Math.max(6,Math.min(22,l*.42))+6)/n,d=h*h,p=e.getLevel(e.currentLevel),u=e._layoutScale;if(u&&p.supernodes.length>100){if(!p._snByBid){p._snByBid=new Map;for(let x of p.supernodes)p._snByBid.set(x.bid,x)}let m=(s-e._layoutOffX)/u+e._layoutMinX,g=(r-e._layoutOffY)/u+e._layoutMinY,f=Math.max(0,Math.min(z-1,Math.floor((m+1)/2*z))),_=Math.max(0,Math.min(z-1,Math.floor((g+1)/2*z))),w=Le-i,S=f>>w,A=_>>w;for(let x=-1;x<=1;x++){let y=A+x;if(!(y<0||y>=a))for(let v=-1;v<=1;v++){let M=S+v;if(M<0||M>=a)continue;let b=p._snByBid.get(M<<i|y);if(!b)continue;let R=b.x-s,B=b.y-r;if(R*R+B*B<d)return{type:"supernode",item:b}}}}else for(let m=0;m<p.supernodes.length;m++){let g=p.supernodes[m],f=g.x-s,_=g.y-r;if(f*f+_*_<d)return{type:"supernode",item:g}}}return null}function nn(e){let t=[],o=[],n=new Set,s=new Map,r=!1,i=0,a=e.length;for(;i<a;){let l=e.indexOf(`
`,i);l===-1&&(l=a);let c=i;for(;c<l&&(e.charCodeAt(c)===32||e.charCodeAt(c)===9||e.charCodeAt(c)===13);)c++;if(i=l+1,c>=l||e.charCodeAt(c)===35)continue;let h=e.indexOf("	",c);if(h<0||h>=l)continue;let d=e.slice(c,h),p=e.indexOf("	",h+1),u=l;u>0&&e.charCodeAt(u-1)===13&&u--;let m=p>=0&&p<l?e.slice(h+1,p):e.slice(h+1,u);if(n.add(d),n.add(m),t.push(d),o.push(m),p>=0&&p<l){let g=e.slice(p+1,u);g&&(r=!0,s.has(d)||s.set(d,new Set),s.has(m)||s.set(m,new Set),s.get(d).add(g),s.get(m).add(g))}}return{edgeFrom:t,edgeTo:o,edgeCount:t.length,edgeTypeMap:r?s:null,nodeIds:n}}function sn(e){let t=new Map,o=[],n=e.split(`
`),s=0;if(n.length>0&&n[0].trim().startsWith("#")){let r=n[0].trim().replace(/^#\s*/,"").split("	");for(let i=3;i<r.length;i++)o.push(r[i].trim().toLowerCase().replace(/\s+/g,"_"));s=1}for(let r=s;r<n.length;r++){let i=n[r].replace(/[\r\n]+$/,"");if(!i||i[0]==="#")continue;let a=i.split("	");if(a.length<2)continue;let l={label:a[1]||a[0],group:a.length>=3?a[2]:"unknown",extraProps:{}};for(let c=3;c<a.length;c++){let h=c-3<o.length?o[c-3]:`prop${c+1}`;l.extraProps[h]=a[c]}t.set(a[0],l)}if(o.length===0)for(let r of t.values()){for(let i of Object.keys(r.extraProps))o.includes(i)||o.push(i);break}return{nodes:t,extraPropNames:o}}function rn(e,t,o){let n=[],s={};for(let u of e.nodeIds){let m=t?t.get(u):null,g=m?m.group:"unknown",f=m?m.label:u,_=e.edgeTypeMap?e.edgeTypeMap.has(u)?[...e.edgeTypeMap.get(u)]:[]:null,w=m?m.extraProps||{}:{},S={id:u,group:g,label:f,degree:0,edgeTypes:_,extraProps:w};s[u]=S,n.push(S)}let r=[],i={};for(let u=0;u<n.length;u++)i[n[u].id]=[];for(let u=0;u<e.edgeCount;u++){let m=e.edgeFrom[u],g=e.edgeTo[u];s[m]&&s[g]&&(r.push({src:m,dst:g}),s[m].degree++,s[g].degree++,i[m].push(g),i[g].push(m))}let a=["group","label","structure","neighbors"];for(let u of o)a.push(u);let l=!!e.edgeTypeMap;l&&a.push("edgetype");let c=new Array(n.length);for(let u=0;u<n.length;u++){let m=i[n[u].id],g=new Array(m.length);for(let f=0;f<m.length;f++)g[f]=s[m[f]].group;c[u]=g}let h=new Set;for(let u=0;u<n.length;u++)h.add(n[u].group);let d=[...h].sort(),p={};for(let u of o){let m=0,g=0,f=1/0,_=-1/0;for(let w=0;w<n.length;w++){let S=n[w].extraProps[u];if(!S||S==="unknown")continue;g++;let A=Number(S);isFinite(A)&&(m++,A<f&&(f=A),A>_&&(_=A))}g>0&&m/g>=.8&&_>f&&(p[u]={min:f,max:_,coarse:5,medium:50,fine:500})}return{nodeArray:n,nodeIndex:s,edges:r,adjList:i,adjGroups:c,groupNames:a,uniqueGroups:d,hasEdgeTypes:l,numericBins:p}}function Nt(e){return e===0?"0":e===1?"1":e<=3?"2-3":e<=7?"4-7":e<=15?"8-15":e<=31?"16-31":"32+"}function Vt(e,t,o,n){let s=e.toLowerCase(),r=-1,i=0;for(let a=0;a<=s.length;a++){let l=a<s.length?s.charCodeAt(a):0;l>=48&&l<=57||l>=97&&l<=122?r<0&&(r=a):(r>=0&&a-r>1&&(o[n+i]="label:"+s.slice(r,a),i++),r=-1)}return i===0&&(o[n]="label:"+t,i=1),n+i}function jt(e,t,o,n,s){if(!t||t==="")return s;let r=Number(t);if(!isFinite(r)||!o)return n[s]=e+":"+t,s+1;let i=o.max-o.min,a=[{prefix:"c",count:o.coarse},{prefix:"m",count:o.medium},{prefix:"f",count:o.fine}];for(let l of a){let c=i/l.count,h=Math.min(l.count-1,Math.floor((r-o.min)/c)),d=o.min+h*c,p=d+c;n[s++]=e+":"+l.prefix+":"+d.toPrecision(3)+"-"+p.toPrecision(3)}return s}function gt(e,t,o,n,s,r){r=r||{};let i={};for(let p=0;p<o.length;p++)i[o[p]]=Re(2001+p,Z);let a=e.length,l=o.length,c=new Float64Array(a*l*2),h={};for(let p=0;p<l;p++)h[o[p]]=p;let d=new Array(200);for(let p=0;p<a;p++){let u=e[p],m=p*l*2;d[0]="group:"+u.group,fe(d,1),de(te,i.group,c,m+h.group*2);let g=Vt(u.label,u.id,d,0);fe(d,g),de(te,i.label,c,m+h.label*2),d[0]="deg:"+Nt(u.degree),d[1]="leaf:"+(u.degree===0),fe(d,2),de(te,i.structure,c,m+h.structure*2);let f=t[p],_=0;if(f.length>0)for(let w=0;w<f.length;w++)d[_++]="ngroup:"+f[w];else d[0]="ngroup:isolated",_=1;if(fe(d,_),de(te,i.neighbors,c,m+h.neighbors*2),n){if(_=0,u.edgeTypes&&u.edgeTypes.length>0)for(let w=0;w<u.edgeTypes.length;w++)d[_++]="etype:"+u.edgeTypes[w];else d[0]="etype:none",_=1;fe(d,_),de(te,i.edgetype,c,m+h.edgetype*2)}for(let w=0;w<s.length;w++){let S=s[w],A=u.extraProps&&u.extraProps[S],x=jt(S,A,r[S],d,0);x>0&&(fe(d,x),de(te,i[S],c,m+h[S]*2))}}return{projBuf:c,groupNames:o}}function qt(e,t){let o=nn(e),n=t?sn(t):null,s=n?n.nodes:null,r=n?n.extraPropNames:[],i=rn(o,s,r),{projBuf:a}=gt(i.nodeArray,i.adjGroups,i.groupNames,i.hasEdgeTypes,r,i.numericBins);return{...i,projBuf:a,extraPropNames:r}}var K=null,an=null,cn=`
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
`,Fe=null;async function un(){if(Fe)return;if(!K)throw new Error("GPU not initialized");K.pushErrorScope("validation");let e=K.createShaderModule({code:ln}),t=await e.getCompilationInfo();for(let n of t.messages)n.type==="error"&&console.error("[GPU] Blend WGSL error:",n.message,"line:",n.lineNum);Fe=K.createComputePipeline({layout:"auto",compute:{module:e,entryPoint:"main"}});let o=await K.popErrorScope();o?console.error("[GPU] Blend pipeline error:",o.message):console.log("[GPU] Blend pipeline ready")}async function hn(e,t,o,n,s,r,i){await un();let a=e.length,l=Math.max(0,Math.min(1,n)),c=0;for(let L of t){let N=o[L]||0;N>c&&(c=N)}let h=Math.max(c*$e,Qe),d=0,p={};for(let L of t)p[L]=Math.max(o[L]||0,h),d+=p[L];let u=new Float32Array(a),m=new Float32Array(a);for(let L=0;L<a;L++){let N=e[L],ee=0,T=0;for(let j of t){let D=N.projections[j];D&&(ee+=D[0]*p[j],T+=D[1]*p[j])}u[L]=ee/d,m[L]=T/d}let g={};for(let L=0;L<a;L++)g[e[L].id]=L;let f=new Uint32Array(a+1),_=0;for(let L=0;L<a;L++){f[L]=_;let N=s[e[L].id];if(N)for(let ee of N)g[ee]!==void 0&&_++}f[a]=_;let w=new Uint32Array(_),S=0;for(let L=0;L<a;L++){let N=s[e[L].id];if(N)for(let ee of N){let T=g[ee];T!==void 0&&(w[S++]=T)}}if(l===0||i===0)return{px:u,py:m};let A=(L,N)=>{let ee=Math.max(256,L.byteLength),T=K.createBuffer({size:ee,usage:N,mappedAtCreation:!0});return new Uint8Array(T.getMappedRange()).set(new Uint8Array(L.buffer,L.byteOffset,L.byteLength)),T.unmap(),T},x=GPUBufferUsage.STORAGE,y=GPUBufferUsage.UNIFORM,v=A(u,x),M=A(m,x),b=A(f,x),R=A(w.length>0?w:new Uint32Array(1),x),B=Math.max(256,a*2*4),P=new Float32Array(a*2);for(let L=0;L<a;L++)P[L*2]=u[L],P[L*2+1]=m[L];let C=A(P,x|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST),E=K.createBuffer({size:B,usage:x|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),F=new ArrayBuffer(16);new Float32Array(F,0,1)[0]=l,new Uint32Array(F,4,1)[0]=a;let H=K.createBuffer({size:16,usage:y,mappedAtCreation:!0});new Uint8Array(H.getMappedRange()).set(new Uint8Array(F)),H.unmap();let G=K.createBindGroup({layout:Fe.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:v}},{binding:1,resource:{buffer:M}},{binding:2,resource:{buffer:b}},{binding:3,resource:{buffer:R}},{binding:4,resource:{buffer:C}},{binding:5,resource:{buffer:E}},{binding:6,resource:{buffer:H}}]}),V=K.createBindGroup({layout:Fe.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:v}},{binding:1,resource:{buffer:M}},{binding:2,resource:{buffer:b}},{binding:3,resource:{buffer:R}},{binding:4,resource:{buffer:E}},{binding:5,resource:{buffer:C}},{binding:6,resource:{buffer:H}}]}),q=Math.ceil(a/64);for(let L=0;L<i;L++){let N=L%2===0?G:V,ee=K.createCommandEncoder(),T=ee.beginComputePass();T.setPipeline(Fe),T.setBindGroup(0,N),T.dispatchWorkgroups(q),T.end(),K.queue.submit([ee.finish()])}let J=i%2===0?C:E,k=i%2===1?E:C,O=Math.max(256,a*2*4),U=K.createBuffer({size:O,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),I=K.createCommandEncoder();I.copyBufferToBuffer(k,0,U,0,a*2*4),K.queue.submit([I.finish()]),await U.mapAsync(GPUMapMode.READ);let W=new Float32Array(U.getMappedRange()).slice(0,a*2);U.unmap(),v.destroy(),M.destroy(),b.destroy(),R.destroy(),C.destroy(),E.destroy(),H.destroy(),U.destroy();let Q=new Float32Array(a),X=new Float32Array(a);for(let L=0;L<a;L++)Q[L]=W[L*2],X[L]=W[L*2+1];return{px:Q,py:X}}async function Yt(e,t,o,n,s,r,i,a,l){let c=await hn(e,t,o,n,s,r,i);for(let h=0;h<e.length;h++)e[h].px=c.px[h],e[h].py=c.py[h];a==="gaussian"?Be(e,l||{}):Pe(e)}var qe=class{constructor(t,o={}){this.canvas=t,this.ctx=t.getContext("2d"),this.nodes=o.nodes||[],this.edges=o.edges||[],this.nodeIndexFull=o.nodeIndexFull||{},this.adjList=o.adjList||{},this.groupNames=o.groupNames||[],this.propWeights={...o.propWeights},this.propColors=o.propColors||{},this.groupColors=o.groupColors||this.propColors.group||{},this.groupProjections={},this.smoothAlpha=o.smoothAlpha||0,this.maxDegree=1,this.hasEdgeTypes=o.hasEdgeTypes||!1;for(let n=0;n<this.groupNames.length;n++)this.groupProjections[this.groupNames[n]]=Re(2001+n,Z);for(let n of this.nodes)n.degree>this.maxDegree&&(this.maxDegree=n.degree);this.W=0,this.H=0,this.currentLevel=o.initialLevel??3,this.baseLevel=this.currentLevel,this.pan={x:0,y:0},this.zoom=1,this.sizeBy=o.sizeBy||"edges",this.sizeLog=o.sizeLog||!1,this.edgeMode=o.edgeMode||"curves",this.heatmapMode=o.heatmapMode||"off",this.quantMode=o.quantMode||"gaussian",this.showLegend=o.showLegend?1:0,this.showResetBtn=o.showResetBtn||!1,this._progressText=null,this.showFps=o.showFps||!1,this._colorScheme=o.colorScheme||0,this._lightMode=o.lightMode||!1,this._useGPU=!1,this._gl=null,this._glCanvas=null,this._glWrapper=null,this._quantStats={},this._blendGen=0,o.webgl&&this._initWebGL(t),this.labelProps=new Set(o.labelProps||[]),this._initLevel=this.currentLevel,this._initColorScheme=this._colorScheme,this.selectedIds=new Set,this._primarySelectedId=null,this.hoveredId=null,this._onSelect=o.onSelect||null,this._onHover=o.onHover||null,this.levels=new Array(ne.length).fill(null),this._cachedDominant="label",this._cachedLabelProps=["label"],this._cachedColorMap={},this._refreshPropCache(),this.mouseDown=!1,this.mouseMoved=!1,this.mouseStart=null,this.t1=null,this.t2=null,this.touchMoved=!1,this._renderPending=!1,this._edgeBuildRaf=null,this._abortController=new AbortController,this._resizeObserver=null,this._onRender=o.onRender||null,o.skipEvents||this._bindEvents(),this.resize()}get renderZoom(){return Math.max(1,this.zoom*Math.pow(2,this.currentLevel-this.baseLevel))}get selectedId(){return this._primarySelectedId}set selectedId(t){this._primarySelectedId=t,t===null?this.selectedIds.clear():this.selectedIds.has(t)||(this.selectedIds.clear(),this.selectedIds.add(t))}isSelected(t){return this.selectedIds.has(t)}toggleSelection(t){this.selectedIds.has(t)?(this.selectedIds.delete(t),this._primarySelectedId=this.selectedIds.size>0?[...this.selectedIds].pop():null):(this.selectedIds.add(t),this._primarySelectedId=t)}get _dominantProp(){return this._cachedDominant}get _labelProp(){return this._cachedLabelProps[0]}_refreshPropCache(){let t="label",o=0;for(let n of this.groupNames)(this.propWeights[n]||0)>o&&(o=this.propWeights[n],t=n);this._cachedDominant=t,this._cachedLabelProps=this.labelProps.size>0?[...this.labelProps]:[t],this._cachedColorMap=this.propColors[t]||{},this.levels=new Array(ne.length).fill(null),this._edgeBuildRaf&&(cancelAnimationFrame(this._edgeBuildRaf),this._edgeBuildRaf=null)}cycleColorScheme(){this._colorScheme=(this._colorScheme+1)%Te.length;for(let t of this.groupNames){let o=[...new Set(this.nodes.map(n=>ae(n,t,this.adjList)))].sort();this.propColors[t]=Ie(o,this._colorScheme)}this._refreshPropCache(),this.layoutAll(),this.render()}get colorScheme(){return this._colorScheme}set colorScheme(t){this._colorScheme=t%Te.length;for(let o of this.groupNames){let n=[...new Set(this.nodes.map(s=>ae(s,o,this.adjList)))].sort();this.propColors[o]=Ie(n,this._colorScheme)}this._refreshPropCache(),this.layoutAll(),this.render()}get colorSchemeName(){return et[this._colorScheme]}get lightMode(){return this._lightMode}set lightMode(t){if(this._lightMode=!!t,this._gl&&this.canvas){let o=this.canvas.ownerDocument?.documentElement;if(o){let n=getComputedStyle(o).getPropertyValue("--canvas-bg").trim(),s=n&&n.match(/#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);s&&(this._gl._clearR=parseInt(s[1],16)/255,this._gl._clearG=parseInt(s[2],16)/255,this._gl._clearB=parseInt(s[3],16)/255)}}this.render()}_nodeLabel(t){let o=this._cachedLabelProps;if(o.length===1)return ae(t,o[0],this.adjList);let n=[];for(let s of o){let r=ae(t,s,this.adjList);r&&r!=="unknown"&&r!==t.id&&n.push(r)}return n.length>0?n.join(" \xB7 "):t.label||t.id}_supernodeLabel(t){let o=this._cachedLabelProps;if(o.length===1)return Je(t,o[0],this.adjList);let n=[];for(let s of o){let r=Je(t,s,this.adjList);r&&r!=="unknown"&&n.push(r)}return n.length>0?n.join(" \xB7 "):t.repName}_nodeColorVal(t){return ae(t,this._cachedDominant,this.adjList)}_nodeColor(t){return this._cachedColorMap[this._nodeColorVal(t)]||"#888888"}_supernodeColor(t){let o={};for(let n of t.members){let s=this._nodeColorVal(n);o[s]=(o[s]||0)+1}return this._cachedColorMap[ye(o)]||"#888888"}getLevel(t){if(this.levels[t])!this.levels[t]._edgesReady&&!this._edgeBuildRaf&&this._scheduleEdgeBuild(t);else{let o=this._dominantProp,n=this.propColors[o];this.levels[t]=wt(ne[t],this.nodes,s=>ae(s,o,this.adjList),s=>this._nodeLabel(s),s=>n&&n[s]||"#888888"),this.layoutAll(),this._scheduleEdgeBuild(t)}return this.levels[t]}_scheduleEdgeBuild(t){this._edgeBuildRaf&&(cancelAnimationFrame(this._edgeBuildRaf),this._edgeBuildRaf=null);let o=this.levels[t];if(!o||o._edgesReady)return;let n=this.edges,s=this.nodeIndexFull,r=ne[t],i=5e4,a=r<=13,l=67108864,c=new Map,h=0,d=()=>{let p=Math.min(h+i,n.length);for(let u=h;u<p;u++){let m=n[u],g=s[m.src],f=s[m.dst];if(!g||!f)continue;let _=Ge(g.gx,g.gy,r),w=Ge(f.gx,f.gy,r);if(_!==w){let S=_<w?_:w,A=_<w?w:_,x=a?S*l+A:S+","+A;c.set(x,(c.get(x)||0)+1)}}if(h=p,this.levels[t]!==o){this._edgeBuildRaf=null;return}if(h<n.length)this._edgeBuildRaf=requestAnimationFrame(d);else{let u=new Array(c.size),m=0;if(a)for(let[g,f]of c)u[m++]={a:g/l|0,b:g%l,weight:f};else for(let[g,f]of c){let _=g.indexOf(",");u[m++]={a:parseInt(g.slice(0,_),10),b:parseInt(g.slice(_+1),10),weight:f}}o.snEdges=u,o._edgesReady=!0,this._edgeBuildRaf=null,this.render()}};this._edgeBuildRaf=requestAnimationFrame(d)}layoutAll(){Dt(this)}render(){this._renderPending||(this._renderPending=!0,requestAnimationFrame(()=>{this._renderPending=!1;let t=performance.now();this._gl&&Rt(this._gl,this),je(this),this._lastFrameMs=performance.now()-t,this._frameCount=(this._frameCount||0)+1;let o=performance.now();this._fpsTime||(this._fpsTime=o),o-this._fpsTime>=1e3&&(this._fps=this._frameCount,this._frameCount=0,this._fpsTime=o),this.showFps&&this._drawFps(),this._postRender()}))}_drawFps(){let t=this.ctx,o=this._fps||0,n=this._lastFrameMs||0,s=this._gl?"GL":"2D",r=`${o} fps \xB7 ${n.toFixed(1)}ms \xB7 ${s}`;t.font="10px JetBrains Mono",t.fillStyle=this._lightMode?"rgba(60,60,80,0.6)":"rgba(200,200,220,0.6)",t.textAlign="left",t.textBaseline="top",t.fillText(r,6,6)}_postRender(){this._onRender&&this._onRender()}showProgress(t){if(this._progressText=t,je(this),t){let o=this.canvas.getContext("2d"),n=this.W,s=this.H,r=28,i=s/2-r/2;o.fillStyle="rgba(10, 10, 15, 0.8)",o.fillRect(0,i,n,r),o.fillStyle="#c8c8d8",o.font="13px Inter, sans-serif",o.textAlign="center",o.textBaseline="middle",o.fillText(t,n/2,s/2)}}renderNow(){je(this)}worldToScreen(t,o){return kt(this,t,o)}screenToWorld(t,o){return Wt(this,t,o)}hitTest(t,o){return Ut(this,t,o)}resize(){this.W=this.canvas.clientWidth||300,this.H=this.canvas.clientHeight||300,this.canvas.width=this.W,this.canvas.height=this.H,this._glCanvas&&(this._glCanvas.width=this.W,this._glCanvas.height=this.H),this.layoutAll(),this.render()}zoomForLevel(t){this.zoom=1,this.pan={x:0,y:0}}switchLevel(t){let o=this.renderZoom;this.currentLevel=t,this.zoom=o/Math.pow(2,t-this.baseLevel),this.selectedId=null,this.layoutAll(),this.render()}_checkAutoLevel(){let t=this.currentLevel,o=Xe.length-1;if(t<o&&this.zoom>=2){this.zoom/=2,this.currentLevel=t+1,this.layoutAll();return}if(t>0&&this.zoom<.5){this.zoom*=2,this.currentLevel=t-1,this.layoutAll(),this.renderZoom<=1&&(this.pan={x:0,y:0});return}this.currentLevel===0&&this.renderZoom<=1&&(this.pan={x:0,y:0})}get useGPU(){return this._useGPU}set useGPU(t){this._useGPU=!!t}get useWebGL(){return!!this._gl}set useWebGL(t){t&&!this._gl?this._initWebGL(this.canvas):!t&&this._gl&&this._destroyWebGL(),this.resize(),this.render()}_initWebGL(t){let o=t.parentElement;if(!o)return;let n=document.createElement("div"),s=getComputedStyle(t);n.style.cssText=`position:relative;width:${s.width};height:${s.height};min-height:0;overflow:hidden;grid-column:${s.gridColumn};grid-row:${s.gridRow}`,o.insertBefore(n,t),n.appendChild(t),this._glWrapper=n,this._glCanvas=document.createElement("canvas"),this._glCanvas.style.cssText="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none";let r=getComputedStyle(t).backgroundColor;if(r&&r!=="rgba(0, 0, 0, 0)"&&(this._glCanvas.style.background=r,this._origCanvasBg=t.style.background),t.style.position="absolute",t.style.top="0",t.style.left="0",t.style.width="100%",t.style.height="100%",t.style.background="transparent",n.insertBefore(this._glCanvas,t),this._gl=Lt(this._glCanvas),!this._gl){n.parentElement.insertBefore(t,n),n.remove(),t.style.position="",t.style.top="",t.style.left="",t.style.width="",t.style.height="",this._origCanvasBg!==void 0?(t.style.background=this._origCanvasBg,this._origCanvasBg=void 0):t.style.background="",this._glCanvas=null,this._glWrapper=null;return}if(r){let i=r.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);i&&(this._gl._clearR=+i[1]/255,this._gl._clearG=+i[2]/255,this._gl._clearB=+i[3]/255)}console.log("[GL] WebGL2 rendering enabled")}_destroyWebGL(){if(this._glCanvas&&(this._glCanvas.remove(),this._glCanvas=null,this._gl=null),this._glWrapper){let t=this._glWrapper.parentElement;t&&(t.insertBefore(this.canvas,this._glWrapper),this._glWrapper.remove()),this._glWrapper=null,this.canvas.style.position="",this.canvas.style.top="",this.canvas.style.left="",this.canvas.style.width="",this.canvas.style.height="",this._origCanvasBg!==void 0&&(this.canvas.style.background=this._origCanvasBg,this._origCanvasBg=void 0),console.log("[GL] WebGL2 rendering disabled")}}async _blend(){if(this._useGPU&&this.nodes.length>5e4)try{await Yt(this.nodes,this.groupNames,this.propWeights,this.smoothAlpha,this.adjList,this.nodeIndexFull,5,this.quantMode,this._quantStats),this._blendGen++;return}catch(t){console.warn("[GPU] Blend failed, falling back to CPU:",t.message)}Ce(this.nodes,this.groupNames,this.propWeights,this.smoothAlpha,this.adjList,this.nodeIndexFull,5,this.quantMode,this._quantStats),this._blendGen++}setWeights(t){Object.assign(this.propWeights,t),this._refreshPropCache(),this._blend().then(()=>{this.layoutAll(),this.render()})}setAlpha(t){this.smoothAlpha=t,this.levels=new Array(ne.length).fill(null),this._blend().then(()=>{this.layoutAll(),this.render()})}setOptions(t){t.heatmapMode!==void 0&&(this.heatmapMode=t.heatmapMode),t.edgeMode!==void 0&&(this.edgeMode=t.edgeMode),t.sizeBy!==void 0&&(this.sizeBy=t.sizeBy),t.sizeLog!==void 0&&(this.sizeLog=t.sizeLog),t.labelProps!==void 0&&(this.labelProps=new Set(t.labelProps),this._refreshPropCache()),this.render()}resetView(){this.currentLevel=this._initLevel,this.baseLevel=this._initLevel,this.zoom=1,this.pan={x:0,y:0},this.selectedId=null,this.hoveredId=null,this._colorScheme!==this._initColorScheme&&(this.colorScheme=this._initColorScheme),this.resize()}exportLayout(){let t=["# id	px	py	gx	gy"];for(let o of this.nodes)t.push(`${o.id}	${o.px}	${o.py}	${o.gx}	${o.gy}`);return t.join(`
`)}_resetBtnRect(){if(!this.showResetBtn)return null;let t=24;return{x:this.W-t-8,y:8,w:t,h:t}}_bindEvents(){let t=this.canvas,o={signal:this._abortController.signal};t.addEventListener("mousedown",r=>{this.mouseDown=!0,this.mouseMoved=!1,this.mouseStart={x:r.clientX,y:r.clientY}},o),t.addEventListener("mousemove",r=>{if(!this.mouseDown){let i=t.getBoundingClientRect(),a=r.clientX-i.left,l=r.clientY-i.top,c=this._resetBtnRect();if(c&&a>=c.x&&a<=c.x+c.w&&l>=c.y&&l<=c.y+c.h){t.style.cursor="pointer";return}let h=this.hitTest(a,l),d=h?h.type==="node"?h.item.id:h.item.bid:null;d!==this.hoveredId&&(this.hoveredId=d,t.style.cursor=d?"pointer":"grab",this._onHover&&this._onHover(h),this.render());return}this.pan.x+=r.clientX-this.mouseStart.x,this.pan.y+=r.clientY-this.mouseStart.y,this.mouseStart={x:r.clientX,y:r.clientY},(Math.abs(this.pan.x)>4||Math.abs(this.pan.y)>4)&&(this.mouseMoved=!0),this.render()},o),t.addEventListener("mouseup",r=>{if(this.mouseDown=!1,!this.mouseMoved){let i=t.getBoundingClientRect(),a=r.clientX-i.left,l=r.clientY-i.top,c=this._resetBtnRect();if(c&&a>=c.x&&a<=c.x+c.w&&l>=c.y&&l<=c.y+c.h){this.resetView();return}if(a<40&&l<20){this.showFps=!this.showFps,this.render();return}let h=this.hitTest(a,l),d=r.ctrlKey||r.metaKey||r.shiftKey;if(h){let p=h.type==="node"?h.item.id:h.item.bid;d?this.toggleSelection(p):this.selectedId=p,this._onSelect&&this._onSelect(h)}else d||(this.selectedId=null);this.render()}},o),t.addEventListener("mouseleave",()=>{this.mouseDown=!1},o),t.addEventListener("dblclick",r=>{r.preventDefault();let i=t.getBoundingClientRect(),a=r.clientX-i.left,l=r.clientY-i.top;if(r.shiftKey)this._animateZoom(1/2,a,l);else{let c=this.hitTest(a,l);c?this._zoomToHit(c):this._animateZoom(2,a,l)}},o);let n=r=>{let i=t.getBoundingClientRect();return{id:r.identifier,x:r.clientX-i.left,y:r.clientY-i.top}},s=(r,i)=>Math.sqrt((r.x-i.x)**2+(r.y-i.y)**2);t.addEventListener("touchstart",r=>{r.preventDefault(),this.touchMoved=!1,r.touches.length===1?(this.t1=n(r.touches[0]),this.t2=null):r.touches.length===2&&(this.t1=n(r.touches[0]),this.t2=n(r.touches[1]))},{passive:!1,signal:this._abortController.signal}),t.addEventListener("touchmove",r=>{if(r.preventDefault(),this.touchMoved=!0,r.touches.length===1&&!this.t2){let i=n(r.touches[0]);this.t1&&(this.pan.x+=i.x-this.t1.x,this.pan.y+=i.y-this.t1.y),this.t1=i,this.render()}else if(r.touches.length===2){let i=n(r.touches[0]),a=n(r.touches[1]);if(this.t1&&this.t2){let l=s(i,a)/(s(this.t1,this.t2)||1),c=(i.x+a.x)/2,h=(i.y+a.y)/2,d=this.renderZoom;this.zoom=Math.max(.25,Math.min(1e4,this.zoom*l)),this._checkAutoLevel();let p=this.renderZoom/d;this.pan.x=c-(c-this.pan.x)*p,this.pan.y=h-(h-this.pan.y)*p;let u=(this.t1.x+this.t2.x)/2,m=(this.t1.y+this.t2.y)/2;this.pan.x+=c-u,this.pan.y+=h-m,this.render()}this.t1=i,this.t2=a}},{passive:!1,signal:this._abortController.signal}),t.addEventListener("touchend",r=>{if(r.preventDefault(),r.touches.length===0){if(!this.touchMoved&&this.t1){let i=this.hitTest(this.t1.x,this.t1.y);i?(this.selectedId=i.type==="node"?i.item.id:i.item.bid,this._onSelect&&this._onSelect(i)):this.selectedId=null,this.render()}this.t1=null,this.t2=null}else r.touches.length===1&&(this.t1=n(r.touches[0]),this.t2=null,this.touchMoved=!0)},{passive:!1,signal:this._abortController.signal}),t.addEventListener("touchcancel",()=>{this.t1=null,this.t2=null},o),t.addEventListener("wheel",r=>{r.preventDefault();let i=t.getBoundingClientRect(),a=r.clientX-i.left,l=r.clientY-i.top,c=r.deltaY<0?1.05:1/1.05,h=this.renderZoom;this.zoom=Math.max(.25,Math.min(1e4,this.zoom*c)),this._checkAutoLevel();let d=this.renderZoom/h;this.pan.x=a-(a-this.pan.x)*d,this.pan.y=l-(l-this.pan.y)*d,this.render()},{passive:!1,signal:this._abortController.signal}),t.setAttribute("tabindex","0"),t.addEventListener("keydown",r=>{r.key==="ArrowLeft"&&this.currentLevel>0?(r.preventDefault(),this.switchLevel(this.currentLevel-1)):r.key==="ArrowRight"&&this.currentLevel<Xe.length-1?(r.preventDefault(),this.switchLevel(this.currentLevel+1)):r.key==="+"||r.key==="="?(r.preventDefault(),this._zoomBy(1.15)):r.key==="-"||r.key==="_"?(r.preventDefault(),this._zoomBy(1/1.15)):r.key==="f"?(this.showFps=!this.showFps,this.render()):r.key==="l"?(this.showLegend=(this.showLegend+1)%5,this.render()):r.key==="c"&&this.cycleColorScheme()},o),typeof ResizeObserver<"u"&&(this._resizeObserver=new ResizeObserver(()=>this.resize()),this._resizeObserver.observe(t))}destroy(){this._abortController.abort(),this._gl&&this._destroyWebGL(),this._resizeObserver&&(this._resizeObserver.disconnect(),this._resizeObserver=null),this._edgeBuildRaf&&(cancelAnimationFrame(this._edgeBuildRaf),this._edgeBuildRaf=null)}_zoomBy(t){let o=this.renderZoom;this.zoom=Math.max(.25,Math.min(1e4,this.zoom*t)),this._checkAutoLevel();let n=this.renderZoom/o;this.pan.x=this.W/2-(this.W/2-this.pan.x)*n,this.pan.y=this.H/2-(this.H/2-this.pan.y)*n,this.render()}_animateZoom(t,o,n){let s={x:this.pan.x,y:this.pan.y},r=this.zoom,i=Math.max(.25,r*t),a=this.renderZoom,c=Math.max(1,i*Math.pow(2,this.currentLevel-this.baseLevel))/a,h={x:o-(o-s.x)*c,y:n-(n-s.y)*c},d=performance.now(),p=u=>{let m=Math.min(1,(u-d)/300),g=1-Math.pow(1-m,3);this.zoom=r+(i-r)*g,this.pan.x=s.x+(h.x-s.x)*g,this.pan.y=s.y+(h.y-s.y)*g,this.renderNow(),m<1?requestAnimationFrame(p):(this._checkAutoLevel(),this.renderNow())};requestAnimationFrame(p)}_zoomToHit(t){let o=t.item,n={x:this.pan.x,y:this.pan.y},s=this.zoom,r=s*2,i=this.worldToScreen(o.x,o.y),a=this.renderZoom,c=Math.max(1,r*Math.pow(2,this.currentLevel-this.baseLevel))/a,h={x:this.W/2-(this.W/2-n.x)*c-(i.x-this.W/2)*c,y:this.H/2-(this.H/2-n.y)*c-(i.y-this.H/2)*c},d=performance.now(),p=u=>{let m=Math.min(1,(u-d)/350),g=1-Math.pow(1-m,3);this.zoom=s+(r-s)*g,this.pan.x=n.x+(h.x-n.x)*g,this.pan.y=n.y+(h.y-n.y)*g,this.renderNow(),m<1?requestAnimationFrame(p):(this._checkAutoLevel(),this.renderNow())};requestAnimationFrame(p)}};function Zt(e,t,o,n,s,r,i,a){let l={};for(let g of r)l[g]=g==="group"?3:g==="label"?1:0;Object.assign(l,a.weights||{});let c={},h={};for(let g of r)h[g]=new Set;for(let g of t){if(h.group.add(g.group||"unknown"),h.label.add(g.label||g.id),h.structure.add(`deg:${g.degree}`),h.neighbors.add("_"),g.edgeTypes){let f=Array.isArray(g.edgeTypes)?g.edgeTypes:[...g.edgeTypes];for(let _ of f)h.edgetype&&h.edgetype.add(_)}if(g.extraProps)for(let[f,_]of Object.entries(g.extraProps))h[f]&&h[f].add(_==null?"unknown":String(_))}for(let g of r)c[g]=Ie([...h[g]].sort(),a.colorScheme||0);let d=a.smoothAlpha||0,p=a.quantMode,u=new qe(e,{nodes:t,edges:o,nodeIndexFull:n,adjList:s,groupNames:r,propWeights:l,propColors:c,groupColors:c.group,hasEdgeTypes:i,smoothAlpha:d,quantMode:p,...a}),m=a.useGPU||a.autoGPU!==!1&&t.length*r.length>2e3;return(async()=>{if(m&&await mt().catch(()=>!1)&&(u.useGPU=!0,console.log(`[GPU] GPU enabled (${t.length} nodes, ${r.length} groups)`)),a.autoTune){u.showProgress("Auto-tuning...");let g={...a.autoTune};g.onProgress=_=>{let w=Math.round(100*_.step/Math.max(1,_.total)),S=_.phase==="presets"?"scanning presets":_.phase==="done"?"done":"refining";u.showProgress(`Auto-tuning: ${S} (${w}%)`)};let f=await tt(u.nodes,u.groupNames,u.adjList,u.nodeIndexFull,g);if(g.weights!==!1&&!a.weights)for(let _ of u.groupNames)u.propWeights[_]=f.weights[_]??0;g.alpha!==!1&&a.smoothAlpha==null&&(u.smoothAlpha=f.alpha),g.quant!==!1&&!a.quantMode&&(u.quantMode=f.quantMode),f.labelProps&&!a.labelProps&&(u.labelProps=new Set(f.labelProps.filter(_=>u.groupNames.includes(_)))),u._quantStats={}}u.levels=new Array(ne.length).fill(null),await u._blend(),u._progressText=null,u._refreshPropCache(),u.layoutAll(),u.render()})(),u}function Kt(e,t,o,n){let s=o.length,r=e.map((l,c)=>{let h={};for(let d=0;d<s;d++){let p=(c*s+d)*2;h[o[d]]=[t[p],t[p+1]]}return{...l,projections:h,px:0,py:0,gx:0,gy:0,x:0,y:0}}),i=Object.fromEntries(r.map(l=>[l.id,l])),a=Object.fromEntries(r.map(l=>[l.id,[]]));for(let l of n)a[l.src]&&a[l.dst]&&(a[l.src].push(l.dst),a[l.dst].push(l.src));return{nodes:r,nodeIndexFull:i,adjList:a}}function Ye(e,t,o,n={}){let s=qt(t,o),{nodes:r,nodeIndexFull:i,adjList:a}=Kt(s.nodeArray,s.projBuf,s.groupNames,s.edges);return Zt(e,r,s.edges,i,a,s.groupNames,s.hasEdgeTypes,n)}function _t(e,t,o,n={}){let s={},r={},i=t.map(f=>{let _=f.id,w=f.group||"unknown",S=f.label||_,A={};for(let y in f)y!=="id"&&y!=="group"&&y!=="label"&&(A[y]=f[y]);let x={id:_,group:w,label:S,degree:0,edgeTypes:null,extraProps:A};return s[_]=x,r[_]=[],x}),a=[];for(let f of o)s[f.src]&&s[f.dst]&&(a.push(f),s[f.src].degree++,s[f.dst].degree++,r[f.src].push(f.dst),r[f.dst].push(f.src));let l=[];if(i.length>0)for(let f of Object.keys(i[0].extraProps))l.push(f);let c=["group","label","structure","neighbors"];for(let f of l)c.push(f);let h=i.map(f=>r[f.id].map(_=>s[_].group)),d={};for(let f of l){let _=0,w=0,S=1/0,A=-1/0;for(let x of i){let y=x.extraProps[f];if(y==null||y==="")continue;w++;let v=Number(y);isFinite(v)&&(_++,v<S&&(S=v),v>A&&(A=v))}w>0&&_/w>=.8&&A>S&&(d[f]={min:S,max:A,coarse:5,medium:50,fine:500})}let{projBuf:p}=gt(i,h,c,!1,l,d),{nodes:u,nodeIndexFull:m,adjList:g}=Kt(i,p,c,a);return Zt(e,u,a,m,g,c,!1,n)}var Xt={level:{prop:"initialLevel",type:"int",default:3},heatmap:{prop:"heatmapMode",type:"string",default:"off"},"edge-mode":{prop:"edgeMode",type:"string",default:"curves"},quant:{prop:"quantMode",type:"string",default:"gaussian"},alpha:{prop:"smoothAlpha",type:"float",default:0},"color-scheme":{prop:"colorScheme",type:"int",default:ze},"size-by":{prop:"sizeBy",type:"string",default:"edges"},webgl:{prop:"webgl",type:"bool",default:!1},"auto-gpu":{prop:"autoGPU",type:"bool",default:!0},"use-gpu":{prop:"useGPU",type:"bool",default:!1},"auto-tune":{prop:"autoTune",type:"json",default:null}},fn=["legend","reset-btn","light-mode","size-log","webgl","auto-gpu"];function dn(e,t){if(e!=null)switch(t){case"int":return parseInt(e,10)||0;case"float":return parseFloat(e)||0;case"bool":return e!=="false"&&e!=="0";case"string":return e;case"json":try{return JSON.parse(e)}catch{return null}default:return e}}var Ze=class extends HTMLElement{static get observedAttributes(){return["edges","nodes","format",...Object.keys(Xt),...fn]}constructor(){super(),this._view=null,this._shadow=this.attachShadow({mode:"open"}),this._shadow.innerHTML=`<style>
      :host { display: block; position: relative; }
      .wrap { width: 100%; height: 100%; position: relative; }
      canvas { width: 100%; height: 100%; display: block; background: var(--bz-bg, #12122a); }
    </style><div class="wrap"><canvas></canvas></div>`,this._canvas=this._shadow.querySelector("canvas")}connectedCallback(){requestAnimationFrame(()=>this._init())}disconnectedCallback(){this._view&&(this._view.destroy(),this._view=null)}async _init(){if(this._view)return;let t=this._buildOpts(),o=this.getAttribute("edges"),n=this.getAttribute("nodes"),s=this.getAttribute("format"),r=this.textContent.trim();if(o){let[i,a]=await Promise.all([fetch(o).then(l=>l.text()),n?fetch(n).then(l=>l.text()).catch(()=>null):Promise.resolve(null)]);this._view=Ye(this._canvas,i,a,t)}else if(r&&s==="json"){let i=JSON.parse(r),a=i.nodes||[],l=i.edges||[];this._view=_t(this._canvas,a,l,t)}else if(r){let i=r.split(`
`),a=r,l=null,c=i.findIndex((h,d)=>d>0&&h.startsWith("# ")&&i[d-1].trim()==="");c>0&&(a=i.slice(0,c-1).join(`
`),l=i.slice(c).join(`
`)),this._view=Ye(this._canvas,a,l,t)}}_buildOpts(){let t={},o=this.getAttribute("weights");if(o){t.weights={};for(let s of o.split(",")){let[r,i]=s.split(":");r&&i&&(t.weights[r.trim()]=parseFloat(i.trim())||0)}}let n=this.getAttribute("label-props");n&&(t.labelProps=n.split(",").map(s=>s.trim()));for(let[s,r]of Object.entries(Xt)){let i=this.getAttribute(s);i!==null&&(t[r.prop]=dn(i,r.type))}return this.hasAttribute("legend")&&(t.showLegend=!0),this.hasAttribute("reset-btn")&&(t.showResetBtn=!0),this.hasAttribute("light-mode")&&(t.lightMode=!0),this.hasAttribute("size-log")&&(t.sizeLog=!0),t}get view(){return this._view}attributeChangedCallback(t,o,n){if(!this._view||o===n)return;let s=this._view;switch(t){case"level":s.switchLevel(parseInt(n)||0);break;case"alpha":s.setAlpha(parseFloat(n)||0);break;case"color-scheme":s.colorScheme=parseInt(n)||0;break;case"light-mode":s.lightMode=this.hasAttribute("light-mode");break;case"legend":s.showLegend=this.hasAttribute("legend")?1:0,s.render();break;case"heatmap":s.setOptions({heatmapMode:n||"off"}),s.render();break;case"edge-mode":s.setOptions({edgeMode:n||"curves"}),s.render();break}}};customElements.define("bz-graph",Ze);export{qe as BitZoomCanvas,Ze as BzGraph,et as COLOR_SCHEME_NAMES,fo as SCHEME_DIVERGING,ho as SCHEME_GRAYSCALE,po as SCHEME_GREENS,lo as SCHEME_INFERNO,co as SCHEME_PLASMA,go as SCHEME_REDS,uo as SCHEME_THERMAL,ao as SCHEME_VIRIDIS,ze as SCHEME_VIVID,tt as autoTuneWeights,_t as createBitZoomFromGraph,Ye as createBitZoomView,Ie as generateGroupColors,mt as initGPU,yo as isWebGL2Available};

(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[190],{5278:function(e,l,s){Promise.resolve().then(s.bind(s,7713))},8566:function(e,l,s){"use strict";s.d(l,{db:function(){return i}});var t=s(5236),r=s(516),n=s(5735);let a=(0,t.ZF)({apiKey:"AIzaSyBdlTxlns8nZFskTbucHaI72CAO1HZa-z0",authDomain:"cubilete-6182f.firebaseapp.com",databaseURL:"https://cubilete-6182f-default-rtdb.firebaseio.com",projectId:"cubilete-6182f",storageBucket:"cubilete-6182f.appspot.com",messagingSenderId:"903682159191",appId:"1:903682159191:web:063d2b14880fd958a72912"}),i=(0,r.N8)(a);(0,n.v0)(a),(0,r.N8)(a),new n.hJ},7713:function(e,l,s){"use strict";s.r(l);var t=s(7437),r=s(2265),n=s(6463),a=s(8566),i=s(516),u=s(9227),c=s(5618),o=s(9250),d=s.n(o);let h=["9","10","J","Q","K","A"],p=()=>{let e=Math.floor(Math.random()*h.length);return h[e]},g=(e,l)=>h.indexOf(e)+1+(l-1)*h.length;l.default=e=>{var l;let{params:s}=e,{gameCode:o}=s,[y,b]=(0,r.useState)(null),[x,j]=(0,r.useState)(""),[v,f]=(0,r.useState)(1),[m,R]=(0,r.useState)(0),[k,C]=(0,r.useState)(0),[S,P]=(0,r.useState)(0),[O,T]=(0,r.useState)(!0),[w,E]=(0,r.useState)(!1),[H,N]=(0,r.useState)({}),[I,_]=(0,r.useState)(!1),[G,L]=(0,r.useState)(null),{language:A}=(0,r.useContext)(u.A),{user:M}=(0,c.a)();(0,n.useRouter)();let[V,D]=(0,r.useState)(""),[F,U]=(0,r.useState)(0),[Y,B]=(0,r.useState)(null),[J,Q]=(0,r.useState)(0),[Z,z]=(0,r.useState)(!1),[K,W]=(0,r.useState)(0),[X,q]=(0,r.useState)(!1);(0,r.useEffect)(()=>{if(!o)return;let e=(0,i.iH)(a.db,"games/".concat(o)),l=(0,i.jM)(e,e=>{let l=e.val();l&&(b(l),W(Object.keys(l.players||{}).length),R(l.roundGuessTotal||0),C(l.actualTotalDice),P(er(l.players)),U(et(l.players)),E(l.allPlayersRolled||!1),N(l.playersChallenges||{}),console.log("data FULL",l),l.allPlayersRolled&&l.roundInProgress?T(!0):T(!1),B(l.previousPlayerGuess||""),Q(l.previousPlayerGuessQuantity||0),l.currentRound&&l.currentRound>0&&ea(l.players,l.currentRound),l.allPlayersRolled&&!l.currentTurn&&$(l.players))});return()=>l()},[o]);let $=e=>{let l=Object.keys(e).filter(l=>e[l].dice>0);if(l.length>0){let e=l[0];(0,i.Vx)((0,i.iH)(a.db,"games/".concat(o)),{currentTurn:e,roundInProgress:!0})}},ee=()=>{if(y&&y.players&&y.players[M.uid]){let e=y.players[M.uid].dice;if(e>0){let l=[];for(let s=0;s<e;s++)l.push(p());(0,i.Vx)((0,i.iH)(a.db,"games/".concat(o,"/players/").concat(M.uid)),{rollResults:l,hasRolled:!0}).then(()=>{let e={...y.players,[M.uid]:{...y.players[M.uid],rollResults:l,hasRolled:!0}};if(Object.values(e).every(e=>e.hasRolled)){let l=er(e);(0,i.Vx)((0,i.iH)(a.db,"games/".concat(o)),{actualTotalDice:l,roundInProgress:!0,allPlayersRolled:!0})}})}}Z||z(!0),new Audio("/images/dices_sound.mp3").play(),q(!0)},el=e=>{let l={...H,[M.uid]:e};N(l),(0,i.Vx)((0,i.iH)(a.db,"games/".concat(o)),{playersChallenges:l}).then(()=>{Object.keys(l).length===Object.keys(y.players).length&&es(l)}),q(!1)},es=e=>{let l={};for(let s in Object.entries(y.players).forEach(s=>{let[t,r]=s;!1===e[t]?k>m?l["players/".concat(t,"/dice")]=r.dice-1:l["players/".concat(t,"/dice")]=r.dice:!0===e[t]&&(k<m?l["players/".concat(t,"/dice")]=r.dice-1:l["players/".concat(t,"/dice")]=r.dice),l["players/".concat(t,"/rollResult")]=null}),l.roundInProgress=!1,l.currentRound=y.currentRound+1,l.roundGuessTotal=0,l.playersChallenges={},l.currentTurn=Object.keys(y.players).filter(e=>y.players[e].dice>0)[0],y.players)l["players/".concat(s,"/hasRolled")]=!1,l["players/".concat(s,"/rollResults")]=[];l.allPlayersRolled=!1,l.roundInProgress=!1,(0,i.Vx)((0,i.iH)(a.db,"games/".concat(o)),l),(0,i.Vx)((0,i.iH)(a.db,"games/".concat(o)),l).then(()=>{P(er(y.players)),ea(y.players,y.currentRound+1)})},et=e=>{let l=0;return Object.values(e).forEach(e=>{l+=Number(e.dice)}),l},er=e=>{let l=0;return Object.values(e).forEach(e=>{if(e.rollResults&&e.rollResults.length>0){let s=e.rollResults.reduce((e,l)=>e+g(l,1),0);l+=s}}),l},en=()=>{let e=Object.keys(y.players).filter(e=>y.players[e].dice>0),l=e.indexOf(y.currentTurn);return e[(l+1)%e.length]},ea=(e,l)=>{let s=Object.keys(e).filter(l=>e[l].dice>0);if(1===s.length&&l>1){let l=s[0];_(!0),L(e[l].name),(0,i.Vx)((0,i.iH)(a.db,"games/".concat(o)),{gameOver:!0,winner:e[l].name})}},ei={es:{guess:"Mandar",roll:"Tirar Dados",believe:"Creo",disbelieve:"No creo",endRound:"Frenar Ronda",winMessage:"ha ganado el juego!",lostMessage:"Has perdido. No puedes participar m\xe1s."},en:{guess:"Guess",roll:"Roll Dice",believe:"Believe",disbelieve:"Disbelieve",endRound:"End Round",winMessage:"has won the game!",lostMessage:"You have lost. You cannot participate anymore."}},eu=e=>{j(e)},ec=e=>{f(l=>{let s=l+e;return s>0?s:1})};return o?(0,t.jsxs)("div",{children:[(0,t.jsxs)("h1",{children:["Room code ",(0,t.jsx)("b",{children:o})," "]}),(0,t.jsxs)("p",{children:["Current Round: ",(0,t.jsx)("b",{children:null==y?void 0:y.currentRound})," "]}),(0,t.jsxs)("p",{children:["Total Dice of All Players  ",(0,t.jsx)("b",{children:F})," "]}),V&&(0,t.jsx)("p",{style:{color:"red"},children:V}),K==(null==y?void 0:y.maxPlayers)&&!Z&&(0,t.jsx)("div",{children:(0,t.jsx)("button",{onClick:ee,children:ei[A].roll})}),I&&G?(0,t.jsxs)("p",{style:{color:"green"},children:[G," ",ei[A].winMessage]}):(0,t.jsx)(t.Fragment,{children:O&&w||!((null==y?void 0:y.currentRound)>1)?y&&y.currentTurn&&M&&M.uid&&y.currentTurn===M.uid&&!Object.keys(H).length?(0,t.jsxs)("div",{children:[(0,t.jsx)("div",{children:h.map(e=>(0,t.jsx)("button",{onClick:()=>eu(e),children:e},e))}),(0,t.jsxs)("div",{children:[(0,t.jsx)("button",{onClick:()=>ec(-1),children:"-"}),(0,t.jsx)("span",{children:v}),(0,t.jsx)("button",{onClick:()=>ec(1),children:"+"})]}),(0,t.jsx)("div",{children:(0,t.jsxs)("button",{onClick:()=>{if(x){let e=g(x,v);if(e>m){let l={roundGuessTotal:e,previousPlayerGuess:x,previousPlayerGuessQuantity:v,currentTurn:en()};B(x),Q(v),R(e),(0,i.Vx)((0,i.iH)(a.db,"games/".concat(o)),{roundGuessTotal:e,currentTurn:en()}),j(""),f(1),D(""),(0,i.Vx)((0,i.iH)(a.db,"games/".concat(o)),l).then(()=>{j(""),f(1),D("")}).catch(e=>D("Error updating guess: ".concat(e.message)))}else D("Your guess must be greater than the previous guess.")}},children:[ei[A].guess," ",v," ",x]})})]}):(0,t.jsx)("p",{children:"Waiting for your turn..."}):(0,t.jsx)("div",{children:(0,t.jsx)("button",{onClick:ee,children:ei[A].roll})})}),O&&w&&(0,t.jsx)(t.Fragment,{children:Object.keys(H).length?(0,t.jsxs)("div",{children:[(0,t.jsx)("button",{onClick:()=>el(!0),children:ei[A].believe}),(0,t.jsx)("button",{onClick:()=>el(!1),children:ei[A].disbelieve})]}):(0,t.jsx)("button",{onClick:()=>el(!1),children:ei[A].disbelieve})}),Y&&(0,t.jsxs)("p",{children:["Last player move ",(0,t.jsxs)("b",{children:[J," ",Y]})]}),(null==y?void 0:y.players)&&Object.values(y.players).map((e,l)=>(0,t.jsxs)("div",{children:[console.log("player.uid HERE HERE",e.uid),(0,t.jsxs)("p",{children:[e.name,":  ",(0,t.jsxs)("b",{children:[e.dice," dice"]})," "]})]},l)),X&&(0,t.jsx)("div",{className:d().diceContainer,children:(0,t.jsx)("img",{className:d().diceImg,src:"/images/cup.gif",alt:"Rolling"})}),(null==y?void 0:null===(l=y.players[M.uid])||void 0===l?void 0:l.rollResults)&&(0,t.jsxs)("div",{children:[(0,t.jsx)("h3",{children:"Your Dice Roll Results:"}),(0,t.jsx)("div",{children:y.players[M.uid].rollResults.map((e,l)=>(0,t.jsxs)("b",{children:[e,", "]},l))})]})]}):(0,t.jsx)("div",{children:"Error: No game code provided"})}},5618:function(e,l,s){"use strict";s.d(l,{AuthProvider:function(){return o},a:function(){return d}});var t=s(7437),r=s(2265),n=s(5735),a=s(516),i=s(8566),u=s(6463);let c=(0,r.createContext)(),o=e=>{let{children:l}=e,[s,o]=(0,r.useState)(null),[d,h]=(0,r.useState)(!0),p=(0,n.v0)(i.app),g=(0,a.N8)(i.app),y=(0,u.useRouter)();(0,r.useEffect)(()=>{let e=(0,n.Aj)(p,async e=>{if(o(e),h(!1),e){let l=(0,a.iH)(g,"users/".concat(e.uid));await (0,a.t8)(l,{displayName:e.displayName,email:e.email,photoURL:e.photoURL}),y.push("/")}});return()=>e()},[p,y,g]);let b=async()=>{try{let e=new n.hJ,l=(await (0,n.rh)(p,e)).user,s=(0,a.iH)(g,"users/".concat(l.uid));await (0,a.t8)(s,{displayName:l.displayName,email:l.email,photoURL:l.photoURL}),o(l),y.push("/")}catch(e){console.error("Error signing in with Google:",e)}},x=async()=>{try{await (0,n.w7)(p),o(null),y.push("/login")}catch(e){console.error("Error signing out:",e)}};return(0,t.jsx)(c.Provider,{value:{user:s,loading:d,signInWithGoogle:b,handleSignOut:x},children:l})},d=()=>(0,r.useContext)(c)},9227:function(e,l,s){"use strict";s.d(l,{A:function(){return n},LanguageProvider:function(){return a}});var t=s(7437),r=s(2265);let n=(0,r.createContext)(),a=e=>{let{children:l}=e,[s,a]=(0,r.useState)("en");return(0,t.jsx)(n.Provider,{value:{language:s,switchLanguage:e=>{a(e)}},children:l})}},9250:function(e){e.exports={diceContainer:"page_diceContainer__PXNTW",diceImg:"page_diceImg__xRgyI"}}},function(e){e.O(0,[213,481,208,591,971,23,744],function(){return e(e.s=5278)}),_N_E=e.O()}]);
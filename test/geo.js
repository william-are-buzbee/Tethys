// Real geometry for the headless preview (test/preview.js): replaces the stub's random primitives with the shapes three.js
// would make (non-indexed triangles, outward winding), real applyMatrix4, flat per-face normals, and the quaternion maths
// part() uses. Load stub.js first, then this. Nothing here is used by the game.
module.exports=function(THREE){
  const {BufferGeometry,BufferAttribute,Vector3,Quaternion,Euler}=THREE;
  function tri(out,a,b,c){out.push(a[0],a[1],a[2],b[0],b[1],b[2],c[0],c[1],c[2]);}
  function finish(pos){const g=new BufferGeometry();g.attributes.position=new BufferAttribute(Float32Array.from(pos),3);g.index=null;return g;}
  class Box extends BufferGeometry{constructor(w=1,h=1,d=1){super();const x=w/2,y=h/2,z=d/2,P=[];
    const q=(a,b,c,dd)=>{tri(P,a,b,c);tri(P,a,c,dd);};
    q([-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z]);q([x,-y,-z],[-x,-y,-z],[-x,y,-z],[x,y,-z]);
    q([x,-y,z],[x,-y,-z],[x,y,-z],[x,y,z]);q([-x,-y,-z],[-x,-y,z],[-x,y,z],[-x,y,-z]);
    q([-x,y,z],[x,y,z],[x,y,-z],[-x,y,-z]);q([-x,-y,-z],[x,-y,-z],[x,-y,z],[-x,-y,z]);
    Object.assign(this,finish(P));}}
  class Sphere extends BufferGeometry{constructor(r=1,ws=8,hs=6){super();ws=Math.max(3,ws|0);hs=Math.max(2,hs|0);const V=[],P=[];
    for(let j=0;j<=hs;j++){const th=j/hs*Math.PI;for(let i=0;i<=ws;i++){const ph=i/ws*2*Math.PI;V.push([-r*Math.cos(ph)*Math.sin(th),r*Math.cos(th),r*Math.sin(ph)*Math.sin(th)]);}}
    for(let j=0;j<hs;j++)for(let i=0;i<ws;i++){const a=V[j*(ws+1)+i],b=V[(j+1)*(ws+1)+i],c=V[(j+1)*(ws+1)+i+1],d=V[j*(ws+1)+i+1];if(j>0)tri(P,a,b,d);if(j<hs-1)tri(P,b,c,d);}
    Object.assign(this,finish(P));}}
  class Cylinder extends BufferGeometry{constructor(rt=1,rb=1,h=1,s=8,hsg=1,open=false){super();s=Math.max(3,s|0);const P=[],y0=h/2,y1=-h/2;
    for(let i=0;i<s;i++){const a0=i/s*2*Math.PI,a1=(i+1)/s*2*Math.PI,c0=Math.sin(a0),z0=Math.cos(a0),c1=Math.sin(a1),z1=Math.cos(a1);
      const t0=[rt*c0,y0,rt*z0],t1=[rt*c1,y0,rt*z1],b0=[rb*c0,y1,rb*z0],b1=[rb*c1,y1,rb*z1];
      if(rt>0)tri(P,t0,b0,t1);if(rb>0)tri(P,t1,b0,b1);
      if(!open){if(rt>0)tri(P,[0,y0,0],t0,t1);if(rb>0)tri(P,[0,y1,0],b1,b0);}}
    Object.assign(this,finish(P));}}
  class Cone extends Cylinder{constructor(r=1,h=1,s=6){super(0,r,h,s,1,false);}}
  class Lathe extends BufferGeometry{constructor(pts,s=8){super();s=Math.max(3,s|0);const P=[];
    for(let i=0;i<s;i++){const a0=i/s*2*Math.PI,a1=(i+1)/s*2*Math.PI,c0=Math.sin(a0),z0=Math.cos(a0),c1=Math.sin(a1),z1=Math.cos(a1);
      for(let k=0;k<pts.length-1;k++){const p=pts[k],q=pts[k+1];const A=[p.x*c0,p.y,p.x*z0],B=[q.x*c0,q.y,q.x*z0],C=[q.x*c1,q.y,q.x*z1],D=[p.x*c1,p.y,p.x*z1];
        if(p.x>1e-6)tri(P,A,D,B);if(q.x>1e-6)tri(P,B,D,C);}}
    Object.assign(this,finish(P));}}
  class Plane extends BufferGeometry{constructor(w=1,h=1,ws=1,hs=1){super();const P=[];
    for(let j=0;j<hs;j++)for(let i=0;i<ws;i++){const x0=-w/2+w*i/ws,x1=-w/2+w*(i+1)/ws,y0=h/2-h*j/hs,y1=h/2-h*(j+1)/hs;tri(P,[x0,y0,0],[x0,y1,0],[x1,y0,0]);tri(P,[x0,y1,0],[x1,y1,0],[x1,y0,0]);}
    Object.assign(this,finish(P));}}
  BufferGeometry.prototype.applyMatrix4=function(m){const e=m.elements,a=this.attributes.position.array;for(let i=0;i<a.length;i+=3){const x=a[i],y=a[i+1],z=a[i+2];a[i]=e[0]*x+e[4]*y+e[8]*z+e[12];a[i+1]=e[1]*x+e[5]*y+e[9]*z+e[13];a[i+2]=e[2]*x+e[6]*y+e[10]*z+e[14];}
    if(this.attributes.normal){const n=this.attributes.normal.array;for(let i=0;i<n.length;i+=3){const x=n[i],y=n[i+1],z=n[i+2];n[i]=e[0]*x+e[4]*y+e[8]*z;n[i+1]=e[1]*x+e[5]*y+e[9]*z;n[i+2]=e[2]*x+e[6]*y+e[10]*z;}}return this;};
  BufferGeometry.prototype.computeVertexNormals=function(){const a=this.attributes.position.array,n=new Float32Array(a.length);
    for(let i=0;i<a.length;i+=9){const ax=a[i+3]-a[i],ay=a[i+4]-a[i+1],az=a[i+5]-a[i+2],bx=a[i+6]-a[i],by=a[i+7]-a[i+1],bz=a[i+8]-a[i+2];let x=ay*bz-az*by,y=az*bx-ax*bz,z=ax*by-ay*bx;const l=Math.hypot(x,y,z)||1;x/=l;y/=l;z/=l;for(let k=0;k<9;k+=3){n[i+k]=x;n[i+k+1]=y;n[i+k+2]=z;}}
    this.attributes.normal=new BufferAttribute(n,3);};
  BufferGeometry.prototype.toNonIndexed=function(){return this.clone();};
  BufferGeometry.prototype.rotateX=function(th){const c=Math.cos(th),s=Math.sin(th),a=this.attributes.position.array;for(let i=0;i<a.length;i+=3){const y=a[i+1],z=a[i+2];a[i+1]=c*y-s*z;a[i+2]=s*y+c*z;}return this;};
  BufferGeometry.prototype.rotateY=function(th){const c=Math.cos(th),s=Math.sin(th),a=this.attributes.position.array;for(let i=0;i<a.length;i+=3){const x=a[i],z=a[i+2];a[i]=c*x+s*z;a[i+2]=-s*x+c*z;}return this;};
  BufferGeometry.prototype.translate=function(x,y,z){const a=this.attributes.position.array;for(let i=0;i<a.length;i+=3){a[i]+=x;a[i+1]+=y;a[i+2]+=z;}return this;};
  // quaternions as three does them
  Quaternion.prototype.setFromEuler=function(e){const c1=Math.cos(e.x/2),c2=Math.cos(e.y/2),c3=Math.cos(e.z/2),s1=Math.sin(e.x/2),s2=Math.sin(e.y/2),s3=Math.sin(e.z/2);
    switch(e.order||'XYZ'){
      case 'XYZ':this.x=s1*c2*c3+c1*s2*s3;this.y=c1*s2*c3-s1*c2*s3;this.z=c1*c2*s3+s1*s2*c3;this.w=c1*c2*c3-s1*s2*s3;break;
      case 'YXZ':this.x=s1*c2*c3+c1*s2*s3;this.y=c1*s2*c3-s1*c2*s3;this.z=c1*c2*s3-s1*s2*c3;this.w=c1*c2*c3+s1*s2*s3;break;
      case 'ZXY':this.x=s1*c2*c3-c1*s2*s3;this.y=c1*s2*c3+s1*c2*s3;this.z=c1*c2*s3+s1*s2*c3;this.w=c1*c2*c3-s1*s2*s3;break;
      case 'ZYX':this.x=s1*c2*c3-c1*s2*s3;this.y=c1*s2*c3+s1*c2*s3;this.z=c1*c2*s3-s1*s2*c3;this.w=c1*c2*c3+s1*s2*s3;break;
      case 'YZX':this.x=s1*c2*c3+c1*s2*s3;this.y=c1*s2*c3+s1*c2*s3;this.z=c1*c2*s3-s1*s2*c3;this.w=c1*c2*c3-s1*s2*s3;break;
      case 'XZY':this.x=s1*c2*c3-c1*s2*s3;this.y=c1*s2*c3-s1*c2*s3;this.z=c1*c2*s3+s1*s2*c3;this.w=c1*c2*c3+s1*s2*s3;break;}
    return this;};
  Quaternion.prototype.setFromUnitVectors=function(a,b){let r=a.x*b.x+a.y*b.y+a.z*b.z+1;
    if(r<1e-6){r=0;if(Math.abs(a.x)>Math.abs(a.z)){this.x=-a.y;this.y=a.x;this.z=0;this.w=r;}else{this.x=0;this.y=-a.z;this.z=a.y;this.w=r;}}
    else{this.x=a.y*b.z-a.z*b.y;this.y=a.z*b.x-a.x*b.z;this.z=a.x*b.y-a.y*b.x;this.w=r;}
    const l=Math.hypot(this.x,this.y,this.z,this.w)||1;this.x/=l;this.y/=l;this.z/=l;this.w/=l;return this;};
  Quaternion.prototype.copy=function(q){this.x=q.x;this.y=q.y;this.z=q.z;this.w=q.w;return this;};
  Quaternion.prototype.multiply=function(q){const ax=this.x,ay=this.y,az=this.z,aw=this.w,bx=q.x,by=q.y,bz=q.z,bw=q.w;this.x=ax*bw+aw*bx+ay*bz-az*by;this.y=ay*bw+aw*by+az*bx-ax*bz;this.z=az*bw+aw*bz+ax*by-ay*bx;this.w=aw*bw-ax*bx-ay*by-az*bz;return this;};
  Vector3.prototype.applyQuaternion=function(q){const x=this.x,y=this.y,z=this.z,qx=q.x,qy=q.y,qz=q.z,qw=q.w;const ix=qw*x+qy*z-qz*y,iy=qw*y+qz*x-qx*z,iz=qw*z+qx*y-qy*x,iw=-qx*x-qy*y-qz*z;this.x=ix*qw+iw*-qx+iy*-qz-iz*-qy;this.y=iy*qw+iw*-qy+iz*-qx-ix*-qz;this.z=iz*qw+iw*-qz+ix*-qy-iy*-qx;return this;};
  THREE.BoxGeometry=Box;THREE.SphereGeometry=Sphere;THREE.CylinderGeometry=Cylinder;THREE.ConeGeometry=Cone;THREE.LatheGeometry=Lathe;THREE.PlaneGeometry=Plane;
};

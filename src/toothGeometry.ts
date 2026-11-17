import * as THREE from 'three';
export type CrownKind='incisor'|'canine'|'premolar'|'molar';
/** Bevelled labial crown silhouettes, rather than spherical tooth placeholders. */
export function createCrownGeometry(kind:CrownKind){
 const s=new THREE.Shape();
 if(kind==='canine'){
  s.moveTo(0,-1.18);s.bezierCurveTo(-.22,-1.04,-.82,-.62,-.94,-.2);s.bezierCurveTo(-1.04,.2,-.9,.76,-.62,.9);s.quadraticCurveTo(0,1,.62,.9);s.bezierCurveTo(.9,.76,1.04,.2,.94,-.2);s.bezierCurveTo(.82,-.62,.22,-1.04,0,-1.18);
 }else if(kind==='incisor'){
  s.moveTo(-.77,-.95);s.quadraticCurveTo(-1.04,-.88,-1,-.48);s.lineTo(-.86,.56);s.quadraticCurveTo(-.72,.94,-.5,.95);s.quadraticCurveTo(0,1.06,.5,.95);s.quadraticCurveTo(.72,.94,.86,.56);s.lineTo(1,-.48);s.quadraticCurveTo(1.04,-.88,.77,-.95);s.lineTo(-.77,-.95);
 }else{
  s.moveTo(-.65,-.92);s.quadraticCurveTo(-1.12,-.72,-1,-.15);s.lineTo(-.86,.6);s.quadraticCurveTo(-.6,1.04,0,.88);s.quadraticCurveTo(.6,1.04,.86,.6);s.lineTo(1,-.15);s.quadraticCurveTo(1.12,-.72,.65,-.92);s.quadraticCurveTo(.22,-1.03,0,-.83);s.quadraticCurveTo(-.22,-1.03,-.65,-.92);
 }
 const geometry=new THREE.ExtrudeGeometry(s,{depth:kind==='molar'?1.25:.85,bevelEnabled:true,bevelSegments:4,steps:1,bevelSize:.13,bevelThickness:.16,curveSegments:10});
 geometry.center();geometry.computeVertexNormals();return geometry;
}

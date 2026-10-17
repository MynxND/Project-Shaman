import{readFile,writeFile}from'node:fs/promises';const p='apps/client/src/game/scenes/FoundationScene.ts';let s=await readFile(p,'utf8');s=s.replace('    resize(this.scale.gameSize);',`    resize(this.scale.gameSize);
    if(process.env.NODE_ENV==='development'&&params.get('mountainReview')==='wide'){
      camera.stopFollow();camera.setZoom(Math.max(camera.width/widthPx,camera.height/heightPx));camera.centerOn(widthPx/2,heightPx/2);
      this.gardenReview='wide';
    }
`);await writeFile(p,s);

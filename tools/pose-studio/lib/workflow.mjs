// API-format MiniMax H3 first/last-frame-to-video graph, mirroring ComfyUI's
// bundled "video_minimax_h3_i2v" template (res_multistep, simple scheduler, BasicGuider).
export const MODELS={
  unet:'minimax_h3_fl2va_pruned_int8_convrot.safetensors',
  clip:'qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors',
  vae:'minimax_h3_video_vae_int8_convrot.safetensors',
  turboLora:'minimax_h3_fl2v_turbo_8step_v1.0_comfyui_bf16.safetensors',
};
// H3 only accepts 17k+5 frame counts at 24 fps.
export const alignLength=n=>{n=Math.max(5,Math.round(n));while(n%17!==5)n++;return n;};

export function buildGraph({prompt,firstImage,lastImage,canvas=768,length=39,seed=1,turbo=true,steps,prefix}){
  const g={
    unet:{class_type:'UNETLoader',inputs:{unet_name:MODELS.unet,weight_dtype:'default'}},
    clip:{class_type:'CLIPLoader',inputs:{clip_name:MODELS.clip,type:'minimax',device:'default'}},
    vae:{class_type:'VAELoader',inputs:{vae_name:MODELS.vae}},
    first:{class_type:'LoadImage',inputs:{image:firstImage}},
    i2v:{class_type:'MiniMaxH3ImageToVideo',inputs:{clip:['clip',0],vae:['vae',0],prompt,width:canvas,height:canvas,length:alignLength(length),first_frame:['first',0]}},
    noise:{class_type:'RandomNoise',inputs:{noise_seed:seed}},
    sampler:{class_type:'KSamplerSelect',inputs:{sampler_name:'res_multistep'}},
    sched:{class_type:'BasicScheduler',inputs:{model:[turbo?'lora':'unet',0],scheduler:'simple',steps:steps||(turbo?8:20),denoise:1}},
    guider:{class_type:'BasicGuider',inputs:{model:[turbo?'lora':'unet',0],conditioning:['i2v',0]}},
    sample:{class_type:'SamplerCustomAdvanced',inputs:{noise:['noise',0],guider:['guider',0],sampler:['sampler',0],sigmas:['sched',0],latent_image:['i2v',1]}},
    decode:{class_type:'VAEDecode',inputs:{samples:['sample',0],vae:['vae',0]}},
    save:{class_type:'SaveImage',inputs:{images:['decode',0],filename_prefix:prefix}},
  };
  if(turbo)g.lora={class_type:'LoraLoaderModelOnly',inputs:{model:['unet',0],lora_name:MODELS.turboLora,strength_model:1}};
  if(lastImage){g.last={class_type:'LoadImage',inputs:{image:lastImage}};g.i2v.inputs.last_frame=['last',0];}
  return g;
}

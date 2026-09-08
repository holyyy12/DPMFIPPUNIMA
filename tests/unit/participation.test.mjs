import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
const require=createRequire(import.meta.url);
async function load(path){let source=await readFile(new URL(path,import.meta.url),'utf8');source=source.replace("from 'zod'",`from '${pathToFileURL(require.resolve('zod')).href}'`);const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;return import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));}
const {ddasSubmissionSchema,ddasTrackingSchema}=await load('../../lib/contracts/ddas.ts');
const {deriveReceipt,encrypt,decrypt}=await load('../../lib/security/crypto.ts');
const {contentMedia}=await load('../../lib/content-media.ts');
const input={category:'Akademik',subject:'Contoh aspirasi',body:'Contoh isi aspirasi untuk pengujian.',consent:true,idempotencyKey:crypto.randomUUID()};
test('optional contacts accept blank, email, and formatted WhatsApp',()=>{
 assert.ok(ddasSubmissionSchema.safeParse({...input,email:'',whatsapp:''}).success);
 const parsed=ddasSubmissionSchema.parse({...input,email:'mahasiswa@example.com',whatsapp:'+62 812-3456-7890'});
 assert.equal(parsed.whatsapp,'+6281234567890');
 assert.equal(ddasSubmissionSchema.safeParse({...input,email:'bukan-email'}).success,false);
});
test('every generated ticket satisfies tracking format and is deterministic',async()=>{
 for(let i=0;i<100;i++){const id=crypto.randomUUID();const r=await deriveReceipt(id,'test-only-pepper');assert.ok(ddasTrackingSchema.safeParse(r).success);assert.deepEqual(r,await deriveReceipt(id,'test-only-pepper'));}
});
test('contact encryption round trips without exposing plain text',async()=>{const key=Buffer.alloc(32,1).toString('base64');const value='{"email":"private@example.com"}';const c=await encrypt(value,key);assert.ok(!c.includes('private'));assert.equal(await decrypt(c,key),value);});
test('gallery uses all media belonging to its content only',()=>{const media=[{url:'https://example.com/a.jpg',name:'Foto'},{url:'https://example.com/b.mp4',name:'Video',mimeType:'video/mp4'}];assert.equal(contentMedia({seo:{program:{documentation:media}}}).length,2);assert.equal(contentMedia({body:{attachments:media.map(m=>({...m,publicUrl:m.url}))}}).length,2);assert.equal(contentMedia({body:{attachments:[{url:'javascript:alert(1)'}]}}).length,0);});

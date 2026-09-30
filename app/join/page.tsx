import JoinForm from './JoinForm';
export default async function JoinPage({searchParams}:{searchParams:Promise<{token?:string}>}){const p=await searchParams;return <JoinForm token={p.token??''}/>}
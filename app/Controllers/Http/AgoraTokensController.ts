import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';
// const {RtcTokenBuilder, RtmTokenBuilder, RtcRole, RtmRole} = require('agora-access-token')
import Env from '@ioc:Adonis/Core/Env'


export default class AgoraTokensController {
    public async getToken ({ request, response }: HttpContextContract) {
        const newSchema = schema.create({
            consultation_id: schema.number(),
            uid: schema.number()
        })

        try {
            let payload = await request.validate({ schema: newSchema })

            const consultationId = payload.consultation_id;
    
            // const user = auth.user
            const appId = Env.get('AGORA_APP_ID');
            const appCertificate = Env.get('AGORA_APP_CERTIFICATE');
            const channelNamePrefix = Env.get('CONSULTATION_CHANNEL_NAME_PREFIX');
            const channelName = `${channelNamePrefix}_${consultationId}`
            // const role = RtcRole.SUBSCRIBER;
            const role = RtcRole.PUBLISHER;
            const expirationTimeInSeconds = 3600;
            const currentTimestamp = Math.floor(Date.now() / 1000);
            const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
            const uid = payload.uid || 0;

            const rtcToken = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, uid, role, privilegeExpiredTs);

            // TODO: send push notification to user (receiver) device

            return {
                appId,
                channelName,
                uid,
                rtcToken
            };

            
        } catch (error) {
            response.badRequest(error.messages)
        }

        /* $request->validate([
            'channelName' => 'string|required',
            'uid' => 'integer|min:0|nullable'
        ]);

        $appID = env('AGORA_APP_ID');
        $appCertificate = env('AGORA_APP_CERTIFICATE');
        $channelName = $request->channelName;
        $user = auth()->user()->name;
        $role = RtcTokenBuilder::RoleAttendee;
        $expireTimeInSeconds = 3600;
        $currentTimestamp = now()->getTimestamp();
        $privilegeExpiredTs = $currentTimestamp + $expireTimeInSeconds;
        $uid = $request->uid ?? rand(9, 99999);

        // $token = RtcTokenBuilder::buildTokenWithUserAccount($appID, $appCertificate, $channelName, $user, $role, $privilegeExpiredTs);
        $token = RtcTokenBuilder::buildTokenWithUid($appID, $appCertificate, $channelName, $uid, $role, $privilegeExpiredTs);

        return response()->json([
            'appID' => $appID, 
            'channelName' => $channelName, 
            'token' => $token, 
            'uid' => $uid
        ]); */

        return "Token"
    }
}

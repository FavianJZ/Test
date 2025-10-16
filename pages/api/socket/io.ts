import { NextApiRequest, NextApiResponse } from 'next'
import { Server as ServerIO } from 'socket.io'
import { Server as NetServer } from 'http'
import SocketHandler from '@/lib/socket-server-new'

export const config = {
  api: {
    bodyParser: false
  }
}

export default SocketHandler
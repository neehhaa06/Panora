import { Injectable } from '@nestjs/common';
import { ApiResponse } from '../../types';
import { HubspotContactInput, HubspotContactOutput } from 'src/crm/@types';
import axios from 'axios';
import { PrismaService } from 'src/@core/prisma/prisma.service';
import { LoggerService } from 'src/@core/logger/logger.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class HubspotService {
  constructor(private prisma: PrismaService, private logger: LoggerService) {
    this.logger.setContext(HubspotService.name);
  }
  async addContact(
    contactData: HubspotContactInput,
    linkedUserId: string,
  ): Promise<ApiResponse<HubspotContactOutput>> {
    try {
      //TODO: check required scope  => crm.objects.contacts.write
      const connection = await this.prisma.connections.findFirst({
        where: {
          id_linked_user: BigInt(linkedUserId),
        },
      });
      const dataBody = {
        properties: contactData,
      };
      const resp = await axios.post(
        `https://api.hubapi.com/crm/v3/objects/contacts/`,
        JSON.stringify(dataBody),
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${connection.access_token}`,
          },
        },
      );
      return {
        data: resp.data,
        message: 'Hubspot contact created',
        statusCode: 201,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Handle Axios-specific errors
        //console.error('Error with Axios request:', error.response?.data);
        this.logger.error('Error with Axios request:', error.response?.data);
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        //console.error('Error with Prisma request:', error);
        this.logger.error('Error with Prisma request:', error.message);
      }
      this.logger.error(
        'An error occurred...',
        error.response?.data || error.message,
      );
    }
    return;
  }
}

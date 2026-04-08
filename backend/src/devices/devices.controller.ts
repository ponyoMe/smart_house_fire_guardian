import { Controller, Get, Param, Post, Body, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { DeviceStatus } from './device.enums';

@ApiTags('devices')
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all devices' })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully retrieved all devices', 
    isArray: true})
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getAll() {
    try {
      return await this.devicesService.getAllDevices();
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve devices');
    }
  }

  @Get(':deviceId')
  @ApiOperation({ summary: 'Get a device by ID' })
  @ApiParam({ name: 'deviceId', description: 'ID of the device to retrieve' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved the device' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getOne(@Param('deviceId') deviceId: string) {
    try {
      const device = await this.devicesService.getDeviceById(deviceId);
      if (!device) {
        throw new NotFoundException('Device not found');
      }
      return device;
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve the device');
    }
  }

  @Post(':deviceId/command')
  @ApiOperation({ summary: 'Send a command to a device' })
  @ApiParam({ name: 'deviceId', description: 'ID of the device to send the command to' })
  @ApiResponse({ status: 200, description: 'Successfully sent the command to the device' })
  @ApiResponse({ status: 400, description: 'Bad request due to invalid command' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async sendDeviceCommand(
    @Param('deviceId') deviceId: string,
    @Body() command: Record<string, any>
  ) {
    try {
      const result = await this.devicesService.sendCommand(deviceId, command);
      if (!result) {
        throw new BadRequestException('Invalid command');
      }
      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error; // Re-throw not found exception
      }
      throw new InternalServerErrorException('Failed to send command');
    }
  }
}
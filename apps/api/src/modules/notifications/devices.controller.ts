import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { CurrentUser, NoOrgContext } from "../../common/decorators";
import type { AuthUser } from "../../common/types";
import { RegisterDeviceDto, UpdateDevicePreferencesDto } from "./dto";
import { PushService } from "./push.service";

@Controller("api/me/devices")
@NoOrgContext()
export class DevicesController {
  constructor(private readonly push: PushService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.push.listDevices(user.id);
  }

  @Post()
  register(@CurrentUser() user: AuthUser, @Body() dto: RegisterDeviceDto) {
    return this.push.registerDevice(user.id, dto);
  }

  @Delete(":token")
  unregister(@CurrentUser() user: AuthUser, @Param("token") token: string) {
    return this.push.unregisterDevice(user.id, decodeURIComponent(token));
  }

  @Patch(":token")
  updatePreferences(
    @CurrentUser() user: AuthUser,
    @Param("token") token: string,
    @Body() dto: UpdateDevicePreferencesDto,
  ) {
    return this.push.updatePreferences(
      user.id,
      decodeURIComponent(token),
      (dto.preferences ?? {}) as Record<string, boolean | undefined>,
    );
  }
}

import { getIO } from "../../libs/socket";
import Contact from "../../models/Contact";

interface ExtraInfo {
  name: string;
  value: string;
}

interface Request {
  name: string;
  number: string;
  isGroup: boolean;
  email?: string;
  commandBot?: string;
  profilePicUrl?: string;
  followUp?: string;
  extraInfo?: ExtraInfo[];
  companyId: number;
}

const CreateOrUpdateContactServiceForImport = async ({
  name,
  number: rawNumber,
  profilePicUrl,
  isGroup,
  email = "",
  commandBot = "",
  followUp = "",
  extraInfo = [], companyId
}: Request): Promise<Contact> => {
  const number = isGroup ? rawNumber : rawNumber.replace(/[^0-9]/g, "");

  const io = getIO();
  let contact: Contact | null;

  contact = await Contact.findOne({ where: { number , companyId } });

  if (contact) {
    const updateData: any = { name, profilePicUrl };
    if (followUp) updateData.followUp = followUp;
    if (contact.companyId === null)
      await contact.update({ ...updateData, companyId })
    else
      await contact.update(updateData);

      io.of(`/workspace-${companyId}`)
  .emit(`company-${companyId}-contact`, {
      action: "update",
      contact
    });
  } else {
    contact = await Contact.create({
      name,
      companyId,
      number,
      profilePicUrl,
      email,
      commandBot,
      isGroup,
      followUp,
      extraInfo
    });

    io.of(`/workspace-${companyId}`)
  .emit(`company-${companyId}-contact`, {
      action: "create",
      contact
    });
  }

  return contact;
};

export default CreateOrUpdateContactServiceForImport;

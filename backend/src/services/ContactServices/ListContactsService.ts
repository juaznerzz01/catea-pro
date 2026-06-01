import { Sequelize, fn, col, where, Op, Filterable } from "sequelize";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import ContactTag from "../../models/ContactTag";

import { intersection } from "lodash";
import Tag from "../../models/Tag";
import ContactProduct from "../../models/ContactProduct";
import removeAccents from "remove-accents";
import Whatsapp from "../../models/Whatsapp";
import User from "../../models/User";
import ShowUserService from "../UserServices/ShowUserService";

interface ColumnFilters {
  name?: string;
  number?: string;
  email?: string;
  followUp?: string;
  tagName?: string;
  productName?: string;
  productStatus?: string;
  attendantName?: string;
}

interface Request {
  searchParam?: string;
  pageNumber?: string;
  companyId: number;
  tagsIds?: number[];
  isGroup?: string;
  userId?: number;
  profile?: string;
  canViewAllContacts?: boolean;
  source?: string;
  onlyAgenda?: boolean;
  columnFilters?: ColumnFilters;
}

interface Response {
  contacts: Contact[];
  count: number;
  hasMore: boolean;
  totalAll: number;
}

const ListContactsService = async ({ searchParam = "",
  pageNumber = "1",
  companyId,
  tagsIds,
  isGroup,
  userId,
  profile,
  canViewAllContacts,
  source,
  onlyAgenda,
  columnFilters
}: Request): Promise<Response> => {
  let whereCondition: Filterable["where"] = {};

  // Lógica principal de restrição de contatos
  // Se o perfil do usuário não for 'admin', aplicamos o filtro.
  if (!(profile === "admin" || canViewAllContacts)) {
    // 1. Busca todos os 'contactId' da tabela de Tickets que pertencem ao 'userId' atual.
    const userTickets = await Ticket.findAll({
      where: { userId },
      attributes: ["contactId"], // Seleciona apenas a coluna 'contactId' para otimização
      group: ["contactId"]       // Agrupa para obter IDs de contato únicos
    });

    // 2. Mapeia o resultado para um array de números (IDs dos contatos)
    const contactIds = userTickets.map(t => t.contactId);

    // 3. Adiciona a condição à query: o ID do contato DEVE estar na lista de IDs que o usuário atendeu.
    // Se o usuário não atendeu nenhum ticket, a lista 'contactIds' será vazia e nenhum contato será retornado.
    whereCondition.id = {
      [Op.in]: contactIds
    };
  }

  if (searchParam) {
    const sanitizedSearchParam = removeAccents(searchParam.toLocaleLowerCase().trim());
    whereCondition = {
      ...whereCondition,
      [Op.or]: [
        {
          name: where(
            fn("LOWER", fn("unaccent", col("Contact.name"))),
            "LIKE",
            `%${sanitizedSearchParam}%`
          )
        },
        { number: { [Op.like]: `%${sanitizedSearchParam}%` } }
      ]
    };
  }

  whereCondition = {
    ...whereCondition,
    companyId
  };

  if (Array.isArray(tagsIds) && tagsIds.length > 0) {
    const contactTagFilter: any[] | null = [];
    const contactTags = await ContactTag.findAll({
      where: { tagId: { [Op.in]: tagsIds } }
    });
    if (contactTags) {
      contactTagFilter.push(contactTags.map(t => t.contactId));
    }

    const contactTagsIntersection: number[] = intersection(...contactTagFilter);

    whereCondition = {
      ...whereCondition,
      id: {
        [Op.in]: contactTagsIntersection
      }
    };
  }

  if (isGroup === "false") {
    console.log("isGroup", isGroup)
    whereCondition = {
      ...whereCondition,
      isGroup: false
    }
  }

  // Filtro por source (se feature flag ativa)
  if (source && process.env.FEATURE_CONTACTS_SOURCE_FIELD === 'true') {
    whereCondition = {
      ...whereCondition,
      source
    };
  }

  // Filtro por isInAgenda (somente contatos da agenda)
  if (onlyAgenda === true && process.env.FEATURE_CONTACTS_ONLY_AGENDA_FILTER === 'true') {
    whereCondition = {
      ...whereCondition,
      isInAgenda: true
    };
  }

  // Filtros de coluna (server-side)
  if (columnFilters) {
    if (columnFilters.name) {
      whereCondition = { ...whereCondition, name: columnFilters.name };
    }
    if (columnFilters.number) {
      whereCondition = { ...whereCondition, number: columnFilters.number };
    }
    if (columnFilters.email) {
      whereCondition = { ...whereCondition, email: columnFilters.email };
    }
    if (columnFilters.followUp) {
      whereCondition = { ...whereCondition, followUp: columnFilters.followUp };
    }

    // Para filtros de relação, coletar IDs e fazer interseção com IDs existentes
    const idSets: number[][] = [];

    // IDs já restringidos (por permissão de usuário ou filtro de tags)
    if (whereCondition.id && whereCondition.id[Op.in]) {
      idSets.push(whereCondition.id[Op.in]);
    }

    // Filtro por tag name
    if (columnFilters.tagName) {
      const tagsWithName = await Tag.findAll({
        where: { name: columnFilters.tagName, companyId },
        attributes: ["id"]
      });
      const tagIds = tagsWithName.map(t => t.id);
      if (tagIds.length > 0) {
        const contactTagsForFilter = await ContactTag.findAll({
          where: { tagId: { [Op.in]: tagIds } }
        });
        idSets.push(contactTagsForFilter.map(ct => ct.contactId));
      } else {
        idSets.push([]);
      }
    }

    // Filtro por product name
    if (columnFilters.productName) {
      const productsWithName = await ContactProduct.findAll({
        where: { name: columnFilters.productName },
        attributes: ["contactId"],
        group: ["contactId"]
      });
      idSets.push(productsWithName.length > 0 ? productsWithName.map(p => p.contactId) : []);
    }

    // Filtro por product status (payment)
    if (columnFilters.productStatus) {
      const productsWithStatus = await ContactProduct.findAll({
        where: { status: columnFilters.productStatus },
        attributes: ["contactId"],
        group: ["contactId"]
      });
      idSets.push(productsWithStatus.length > 0 ? productsWithStatus.map(p => p.contactId) : []);
    }

    // Filtro por attendant name
    if (columnFilters.attendantName) {
      const attendantUsers = await User.findAll({
        where: { name: columnFilters.attendantName, companyId },
        attributes: ["id"]
      });
      const attendantUserIds = attendantUsers.map(u => u.id);
      if (attendantUserIds.length > 0) {
        const openTickets = await Ticket.findAll({
          where: {
            userId: { [Op.in]: attendantUserIds },
            status: { [Op.in]: ["open", "pending"] }
          },
          attributes: ["contactId"],
          group: ["contactId"]
        });
        idSets.push(openTickets.length > 0 ? openTickets.map(t => t.contactId) : []);
      } else {
        idSets.push([]);
      }
    }

    // Se há restrições de ID, fazer interseção de todos os conjuntos
    if (idSets.length > 0) {
      const intersectedIds: number[] = intersection(...idSets);
      whereCondition = {
        ...whereCondition,
        id: { [Op.in]: intersectedIds }
      };
    }
  }

  const limit = 100;
  const offset = limit * (+pageNumber - 1);

  // Contagem total sem filtros (para header X-Total-Count-All)
  const totalAll = await Contact.count({
    where: { companyId }
  });

  const { count, rows: contacts } = await Contact.findAndCountAll({
    where: whereCondition,
    attributes: [
      "id", "name", "number", "email", "followUp", "isGroup", "urlPicture",
      "active", "companyId", "channel",
      // Condicionar novos campos à feature flag para evitar erro SQL quando campos não existem
      ...(process.env.FEATURE_CONTACTS_SOURCE_FIELD === 'true' ? ["source"] : []),
      ...(process.env.FEATURE_CONTACTS_ONLY_AGENDA_FILTER === 'true' ? ["isInAgenda"] : [])
    ],
    limit,
    include: [
      {
        model: Tag,
        as: "tags",
        attributes: ["id", "name", "color"]
      },
      {
        model: ContactProduct,
        as: "products",
        attributes: ["id", "name", "status"]
      },
      {
        model: Ticket,
        as: "tickets",
        attributes: ["id", "status", "userId"],
        where: { status: { [Op.in]: ["open", "pending"] } },
        required: false,
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name"]
          }
        ]
      },
      {
        model: Whatsapp,
        as: "whatsapp",
        attributes: ["id", "name"]
      }
    ],
    offset,
    order: [["name", "ASC"]]
  });

  const hasMore = count > offset + contacts.length;

  return {
    contacts,
    count,
    hasMore,
    totalAll
  };
};

export default ListContactsService;
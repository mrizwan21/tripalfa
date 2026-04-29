/**
 * @swagger
 * /api/duffel/partial-offer-requests:
 *   post:
 *     summary: Create a partial offer request for segment-by-segment pricing
 *     tags: [Duffel Enhanced]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [slices, passengers]
 *             properties:
 *               slices:
 *                 type: array
 *                 items:
 *                   type: object
 *               passengers:
 *                 type: array
 *                 items:
 *                   type: object
 *               cabin_class:
 *                 type: string
 *                 default: economy
 *               return_available_services:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Partial offer request created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post('/partial-offer-requests', async (req: Request, res: Response) => {
  try {
    const { slices, passengers, cabin_class, return_available_services } = req.body;

    if (!slices || !Array.isArray(slices) || slices.length === 0) {
      return res.status(400).json({ error: 'slices is required' });
    }

    if (!passengers || !Array.isArray(passengers) || passengers.length === 0) {
      return res.status(400).json({ error: 'passengers is required' });
    }

    const partialRequestData: any = {
      slices,
      passengers,
      cabin_class: cabin_class || 'economy',
      return_available_services: return_available_services ?? true,
    };

    const duffelResponse = await duffelClient.request({
      method: 'POST',
      url: '/air/partial_offer_requests',
      data: {
        data: partialRequestData,
      },
    });

    const requestId = duffelResponse.data.id;

    let partialRequest: { id?: string } | null = null;
    try {
      partialRequest = await withTimeout(
        prisma.duffelPartialOfferRequest.create({
          data: {
            externalId: requestId,
            slices: slices,
            passengers: passengers,
            cabinClass: cabin_class,
            status: 'pending',
          },
        }),
        DB_WRITE_TIMEOUT_MS
      );
    } catch (dbError: any) {
      console.warn(
        '[Duffel] Partial offer request local persistence skipped:',
        dbError?.message || dbError
      );
    }

    res.json({
      success: true,
      data: duffelResponse.data,
      localId: partialRequest?.id,
      message: 'Partial offer request created',
    });
  } catch (error: any) {
    console.error('[Duffel] Create partial offer request error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/duffel/partial-offer-requests/{id}:
 *   get:
 *     summary: Get partial offer request by ID
 *     tags: [Duffel Enhanced]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Partial offer request ID
 *     responses:
 *       200:
 *         description: Partial offer request retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get('/partial-offer-requests/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    try {
      const duffelResponse = await duffelClient.request({
        method: 'GET',
        url: `/air/partial_offer_requests/${id}`,
      });

      await prisma.duffelPartialOfferRequest.upsert({
        where: { externalId: String(id) },
        update: {
          slices: duffelResponse.data.slices,
          passengers: duffelResponse.data.passengers,
          cabinClass: duffelResponse.data.cabin_class,
          status: duffelResponse.data.status,
        },
        create: {
          externalId: duffelResponse.data.id,
          slices: duffelResponse.data.slices,
          passengers: duffelResponse.data.passengers,
          cabinClass: duffelResponse.data.cabin_class,
          status: duffelResponse.data.status,
        },
      });

      return res.json({
        success: true,
        data: duffelResponse.data,
      });
    } catch (duffelError) {
      const partialRequest = await prisma.duffelPartialOfferRequest.findUnique({
        where: { externalId: String(id) },
        include: { partialOfferFares: true },
      });

      if (partialRequest) {
        return res.json({
          success: true,
          data: partialRequest,
        });
      }

      return res.status(404).json({ error: 'Partial offer request not found' });
    }
  } catch (error: any) {
    console.error('[Duffel] Get partial offer request error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/duffel/partial-offer-requests/{id}/fares:
 *   get:
 *     summary: Get fares for a partial offer request
 *     tags: [Duffel Enhanced]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Partial offer request ID
 *     responses:
 *       200:
 *         description: Fares retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get('/partial-offer-requests/:id/fares', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const duffelResponse = await duffelClient.request({
      method: 'GET',
      url: `/air/partial_offer_requests/${id}/fares`,
    });

    if (duffelResponse.data.data && Array.isArray(duffelResponse.data.data)) {
      await prisma.duffelPartialOfferFare.createMany({
        data: duffelResponse.data.data.map((fare: any) => ({
          partialRequestId: id,
          fareId: fare.id,
          amount: parseFloat(fare.amount),
          currency: fare.currency,
          conditions: fare.conditions,
        })),
        skipDuplicates: true,
      });
    }

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error('[Duffel] Get partial offer fares error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// BATCH OFFER REQUESTS - Bulk Flight Search
// ============================================================================

/**
 * @swagger
 * /api/duffel/batch-offer-requests:
 *   post:
 *     summary: Create a batch offer request for multiple searches
 *     tags: [Duffel Enhanced]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [requests]
 *             properties:
 *               requests:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Batch offer request created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post('/batch-offer-requests', async (req: Request, res: Response) => {
  try {
    const { requests } = req.body;

    if (!requests || !Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({ error: 'requests array is required' });
    }

    const batchRequestData: any = {
      requests: requests.map((req: any) => ({
        slices: req.slices,
        passengers: req.passengers,
        cabin_class: req.cabin_class || 'economy',
      })),
    };

    const duffelResponse = await duffelClient.request({
      method: 'POST',
      url: '/air/batch_offer_requests',
      data: {
        data: batchRequestData,
      },
    });

    const batchId = duffelResponse.data.id;

    let batchRequest: { id?: string } | null = null;
    try {
      batchRequest = await withTimeout(
        prisma.duffelBatchOfferRequest.create({
          data: {
            externalId: batchId,
            requests: requests,
            status: 'pending',
          },
        }),
        DB_WRITE_TIMEOUT_MS
      );
    } catch (dbError: any) {
      console.warn(
        '[Duffel] Batch offer request local persistence skipped:',
        dbError?.message || dbError
      );
    }

    res.json({
      success: true,
      data: duffelResponse.data,
      localId: batchRequest?.id,
      message: 'Batch offer request created',
    });
  } catch (error: any) {
    console.error('[Duffel] Create batch offer request error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// BATCH OFFER REQUESTS - Bulk Flight Search
// ============================================================================

/**
 * @swagger
 * /api/duffel/batch-offer-requests:
 *   post:
 *     summary: Create a batch offer request for multiple searches
 *     tags: [Duffel Enhanced]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [requests]
 *             properties:
 *               requests:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Batch offer request created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post('/batch-offer-requests', async (req: Request, res: Response) => {
  try {
    const { requests } = req.body;

    if (!requests || !Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({ error: 'requests array is required' });
    }

    const batchRequestData: any = {
      requests: requests.map((req: any) => ({
        slices: req.slices,
        passengers: req.passengers,
        cabin_class: req.cabin_class || 'economy',
      })),
    };

    const duffelResponse = await duffelClient.request({
      method: 'POST',
      url: '/air/batch_offer_requests',
      data: {
        data: batchRequestData,
      },
    });

    const batchId = duffelResponse.data.id;

    let batchRequest: { id?: string } | null = null;
    try {
      batchRequest = await withTimeout(
        prisma.duffelBatchOfferRequest.create({
          data: {
            externalId: batchId,
            requests: requests,
            status: 'pending',
          },
        }),
        DB_WRITE_TIMEOUT_MS
      );
    } catch (dbError: any) {
      console.warn(
        '[Duffel] Batch offer request local persistence skipped:',
        dbError?.message || dbError
      );
    }

    res.json({
      success: true,
      data: duffelResponse.data,
      localId: batchRequest?.id,
      message: 'Batch offer request created',
    });
  } catch (error: any) {
    console.error('[Duffel] Create batch offer request error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/duffel/batch-offer-requests/{id}:
 *   get:
 *     summary: Get batch offer request by ID
 *     tags: [Duffel Enhanced]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Batch offer request ID
 *     responses:
 *       200:
 *         description: Batch offer request retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Batch offer request not found
 */
router.get('/batch-offer-requests/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Try Duffel API first
    try {
      const duffelResponse = await duffelClient.request({
        method: 'GET',
        url: `/air/batch_offer_requests/${id}`,
      });

      // Store/update in database
      await prisma.duffelBatchOfferRequest.upsert({
        where: { externalId: String(id) },
        update: {
          requests: duffelResponse.data.requests,
          status: duffelResponse.data.status,
          completedAt: duffelResponse.data.completed_at
            ? new Date(duffelResponse.data.completed_at)
            : null,
          results: duffelResponse.data.results,
        },
        create: {
          externalId: duffelResponse.data.id,
          requests: duffelResponse.data.requests,
          status: duffelResponse.data.status,
          completedAt: duffelResponse.data.completed_at
            ? new Date(duffelResponse.data.completed_at)
            : null,
          results: duffelResponse.data.results,
        },
      });

      return res.json({
        success: true,
        data: duffelResponse.data,
      });
    } catch (duffelError) {
      // Fallback to database
      const batchRequest = await prisma.duffelBatchOfferRequest.findUnique({
        where: { externalId: String(id) },
      });

      if (batchRequest) {
        return res.json({
          success: true,
          data: batchRequest,
        });
      }

      return res.status(404).json({ error: 'Batch offer request not found' });
    }
  } catch (error: any) {
    console.error('[Duffel] Get batch offer request error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ORDER CHANGES - Flight Modifications
// ============================================================================

/**
 * @swagger
 * /api/duffel/order-change-requests:
 *   post:
 *     summary: Create an order change request
 *     tags: [Duffel Enhanced]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [order_id, slices]
 *             properties:
 *               order_id:
 *                 type: string
 *               slices:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Order change request created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 */
router.post('/order-change-requests', async (req: Request, res: Response) => {
  try {
    const { order_id, slices } = req.body;

    if (!order_id) {
      return res.status(400).json({ error: 'order_id is required' });
    }

    if (!slices) {
      return res.status(400).json({ error: 'slices is required' });
    }

    // Call Duffel API
    const duffelResponse = await duffelClient.request({
      method: 'POST',
      url: '/air/order_change_requests',
      data: {
        data: {
          order_id,
          slices,
        },
      },
    });

    const changeData = duffelResponse.data;

    // Store in database
    const order = await prisma.duffelOrder.findUnique({
      where: { externalId: order_id },
    });

    if (order) {
      await prisma.duffelOrderChangeRequest.create({
        data: {
          externalId: changeData.id,
          orderId: order.id,
          requestedChanges: slices,
          changeOffers: changeData.order_change_offers,
          status: 'pending',
        },
      });
    }

    res.json({
      success: true,
      data: changeData,
    });
  } catch (error: any) {
    console.error('[Duffel] Create order change request error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/duffel/order-change-requests/{id}:
 *   get:
 *     summary: Get order change request by ID
 *     tags: [Duffel Enhanced]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order change request ID
 *     responses:
 *       200:
 *         description: Order change request retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Order change request not found
 */
router.get('/order-change-requests/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Try Duffel API first
    try {
      const duffelResponse = await duffelClient.request({
        method: 'GET',
        url: `/air/order_change_requests/${id}`,
      });

      // Store/update in database
      const order = await prisma.duffelOrder.findFirst({
        where: {
          duffelOrderChangeRequests: {
            some: { externalId: String(id) },
          },
        },
      });

      if (order) {
        await prisma.duffelOrderChangeRequest.upsert({
          where: { externalId: String(id) },
          update: {
            requestedChanges: duffelResponse.data.slices,
            changeOffers: duffelResponse.data.order_change_offers,
            status: duffelResponse.data.status,
          },
          create: {
            externalId: duffelResponse.data.id,
            orderId: order.id,
            requestedChanges: duffelResponse.data.slices,
            changeOffers: duffelResponse.data.order_change_offers,
            status: duffelResponse.data.status,
          },
        });
      }

      return res.json({
        success: true,
        data: duffelResponse.data,
      });
    } catch (duffelError) {
      // Fallback to database
      const changeRequest = await prisma.duffelOrderChangeRequest.findUnique({
        where: { externalId: String(id) },
      });

      if (changeRequest) {
        return res.json({
          success: true,
          data: changeRequest,
        });
      }

      return res.status(404).json({ error: 'Order change request not found' });
    }
  } catch (error: any) {
    console.error('[Duffel] Get order change request error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/duffel/order-changes:
 *   post:
 *     summary: Create a pending order change
 *     tags: [Duffel Enhanced]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [selected_order_change_offer]
 *             properties:
 *               selected_order_change_offer:
 *                 type: object
 *                 required: [id]
 *                 properties:
 *                   id:
 *                     type: string
 *     responses:
 *       200:
 *         description: Order change created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 */
router.post('/order-changes', async (req: Request, res: Response) => {
  try {
    const { selected_order_change_offer } = req.body;

    if (!selected_order_change_offer?.id) {
      return res.status(400).json({ error: 'selected_order_change_offer.id is required' });
    }

    // Call Duffel API
    const duffelResponse = await duffelClient.request({
      method: 'POST',
      url: '/air/order_changes',
      data: {
        data: {
          selected_order_change_offer,
        },
      },
    });

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error('[Duffel] Create order change error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/duffel/order-changes/confirm:
 *   post:
 *     summary: Confirm an order change
 *     tags: [Duffel Enhanced]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [order_change_id]
 *             properties:
 *               order_change_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order change confirmed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 */
router.post('/order-changes/confirm', async (req: Request, res: Response) => {
  try {
    const { order_change_id } = req.body;

    if (!order_change_id) {
      return res.status(400).json({ error: 'order_change_id is required' });
    }

    // Call Duffel API
    const duffelResponse = await duffelClient.request({
      method: 'POST',
      url: '/air/order_changes/confirm',
      data: {
        data: { order_change_id },
      },
    });

    // Update in database
    await prisma.duffelOrderChangeRequest.updateMany({
      where: { externalId: order_change_id },
      data: {
        status: 'confirmed',
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error('[Duffel] Confirm order change error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// AIRLINE CREDITS - Refund Management
// ============================================================================

/**
 * @swagger
 * /api/duffel/airline-credits:
 *   get:
 *     summary: List airline credits for an order
 *     tags: [Duffel Enhanced]
 *     parameters:
 *       - in: query
 *         name: order_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Airline credits retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 */
router.get('/airline-credits', async (req: Request, res: Response) => {
  try {
    const { order_id } = req.query;

    if (!order_id) {
      return res.status(400).json({ error: 'order_id is required' });
    }

    // Call Duffel API
    const duffelResponse = await duffelClient.request({
      method: 'GET',
      url: `/air/airline_credits?order_id=${order_id}`,
    });

    // Store in database
    if (duffelResponse.data.data && Array.isArray(duffelResponse.data.data)) {
      const order = await prisma.duffelOrder.findUnique({
        where: { externalId: String(order_id) },
      });

      if (order) {
        await prisma.duffelAirlineCredit.createMany({
          data: duffelResponse.data.data.map((credit: any) => ({
            externalId: credit.id,
            orderId: order.id,
            amount: parseFloat(credit.amount),
            currency: credit.currency,
            reason: credit.reason,
            expiresAt: credit.expires_at ? new Date(credit.expires_at) : null,
            status: credit.status,
          })),
          skipDuplicates: true,
        });
      }
    }

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error('[Duffel] List airline credits error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/duffel/airline-credits:
 *   post:
 *     summary: Create an airline credit
 *     tags: [Duffel Enhanced]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [order_id, amount, currency]
 *             properties:
 *               order_id:
 *                 type: string
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *               reason:
 *                 type: string
 *                 default: Customer service
 *     responses:
 *       200:
 *         description: Airline credit created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 */
router.post('/airline-credits', async (req: Request, res: Response) => {
  try {
    const { order_id, amount, currency, reason } = req.body;

    if (!order_id) {
      return res.status(400).json({ error: 'order_id is required' });
    }

    if (!amount || !currency) {
      return res.status(400).json({ error: 'amount and currency are required' });
    }

    // Call Duffel API
    const duffelResponse = await duffelClient.request({
      method: 'POST',
      url: '/air/airline_credits',
      data: {
        data: {
          order_id,
          amount: {
            amount: String(amount),
            currency: currency,
          },
          reason: reason || 'Customer service',
        },
      },
    });

    const creditData = duffelResponse.data;

    // Store in database
    const order = await prisma.duffelOrder.findUnique({
      where: { externalId: order_id },
    });

    if (order) {
      await prisma.duffelAirlineCredit.create({
        data: {
          externalId: creditData.id,
          orderId: order.id,
          amount: parseFloat(creditData.amount),
          currency: creditData.currency,
          reason: creditData.reason,
          expiresAt: creditData.expires_at ? new Date(creditData.expires_at) : null,
          status: creditData.status,
        },
      });
    }

    res.json({
      success: true,
      data: creditData,
    });
  } catch (error: any) {
    console.error('[Duffel] Create airline credit error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/duffel/airline-credits/{id}:
 *   get:
 *     summary: Get airline credit by ID
 *     tags: [Duffel Enhanced]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Airline credit ID
 *     responses:
 *       200:
 *         description: Airline credit retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Airline credit not found
 */
router.get('/airline-credits/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Try Duffel API first
    try {
      const duffelResponse = await duffelClient.request({
        method: 'GET',
        url: `/air/airline_credits/${id}`,
      });

      // Store/update in database
      const credit = await prisma.duffelAirlineCredit.findUnique({
        where: { externalId: String(id) },
      });

      if (credit) {
        await prisma.duffelAirlineCredit.update({
          where: { id: credit.id },
          data: {
            amount: parseFloat(duffelResponse.data.amount),
            currency: duffelResponse.data.currency,
            reason: duffelResponse.data.reason,
            expiresAt: duffelResponse.data.expires_at
              ? new Date(duffelResponse.data.expires_at)
              : null,
            status: duffelResponse.data.status,
            usedAt: duffelResponse.data.used_at ? new Date(duffelResponse.data.used_at) : null,
          },
        });
      }

      return res.json({
        success: true,
        data: duffelResponse.data,
      });
    } catch (duffelError) {
      // Fallback to database
      const credit = await prisma.duffelAirlineCredit.findUnique({
        where: { externalId: String(id) },
      });

      if (credit) {
        return res.json({
          success: true,
          data: credit,
        });
      }

      return res.status(404).json({ error: 'Airline credit not found' });
    }
  } catch (error: any) {
    console.error('[Duffel] Get airline credit error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// SERVICES MANAGEMENT - Ancillary Services
// ============================================================================

/**
 * @swagger
 * /api/duffel/services:
 *   get:
 *     summary: List services for an order
 *     tags: [Duffel Enhanced]
 *     parameters:
 *       - in: query
 *         name: order_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Services retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 */
router.get('/services', async (req: Request, res: Response) => {
  try {
    const { order_id } = req.query;

    if (!order_id) {
      return res.status(400).json({ error: 'order_id is required' });
    }

    // Call Duffel API
    const duffelResponse = await duffelClient.request({
      method: 'GET',
      url: `/air/orders/${order_id}/services`,
    });

    // Store in database
    if (duffelResponse.data.data && Array.isArray(duffelResponse.data.data)) {
      const order = await prisma.duffelOrder.findUnique({
        where: { externalId: String(order_id) },
      });

      if (order) {
        await prisma.duffelService.createMany({
          data: duffelResponse.data.data.map((service: any) => ({
            externalId: service.id,
            orderId: order.id,
            type: service.type,
            name: service.name,
            description: service.description,
            amount: parseFloat(service.total_amount),
            currency: service.total_currency,
          })),
          skipDuplicates: true,
        });
      }
    }

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error('[Duffel] List services error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/duffel/services:
 *   post:
 *     summary: Add services to an order
 *     tags: [Duffel Enhanced]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [order_id, services]
 *             properties:
 *               order_id:
 *                 type: string
 *               services:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Services added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 */
router.post('/services', async (req: Request, res: Response) => {
  try {
    const { order_id, services } = req.body;

    if (!order_id) {
      return res.status(400).json({ error: 'order_id is required' });
    }

    if (!services || !Array.isArray(services)) {
      return res.status(400).json({ error: 'services array is required' });
    }

    // Call Duffel API
    const duffelResponse = await duffelClient.request({
      method: 'POST',
      url: '/air/order_services',
      data: {
        data: {
          order_id,
          services,
        },
      },
    });

    // Store in database
    const order = await prisma.duffelOrder.findUnique({
      where: { externalId: order_id },
    });

    if (order && duffelResponse.data.data) {
      await prisma.duffelService.createMany({
        data: duffelResponse.data.data.map((service: any) => ({
          externalId: service.id,
          orderId: order.id,
          type: service.type,
          name: service.name,
          description: service.description,
          amount: parseFloat(service.total_amount),
          currency: service.total_currency,
        })),
        skipDuplicates: true,
      });
    }

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error('[Duffel] Add services error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ENHANCED PAYMENTS - Payment Management
// ============================================================================

/**
 * @swagger
 * /api/duffel/payments:
 *   get:
 *     summary: List payments for an order
 *     tags: [Duffel Enhanced]
 *     parameters:
 *       - in: query
 *         name: order_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Payments retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 */
router.get('/payments', async (req: Request, res: Response) => {
  try {
    const { order_id } = req.query;

    if (!order_id) {
      return res.status(400).json({ error: 'order_id is required' });
    }

    // Call Duffel API
    const duffelResponse = await duffelClient.request({
      method: 'GET',
      url: `/air/orders/${order_id}/payments`,
    });

    // Store in database
    if (duffelResponse.data.data && Array.isArray(duffelResponse.data.data)) {
      const order = await prisma.duffelOrder.findUnique({
        where: { externalId: String(order_id) },
      });

      if (order) {
        await prisma.duffelPayment.createMany({
          data: duffelResponse.data.data.map((payment: any) => ({
            externalId: payment.id,
            orderId: order.id,
            amount: parseFloat(payment.amount),
            currency: payment.currency,
            paymentMethod: payment.payment_method?.type || 'unknown',
            status: payment.status,
            gateway: payment.gateway,
            transactionId: payment.transaction_id,
          })),
          skipDuplicates: true,
        });
      }
    }

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error('[Duffel] List payments error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/duffel/payments:
 *   post:
 *     summary: Create a payment for an order
 *     tags: [Duffel Enhanced]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [order_id, payment_method]
 *             properties:
 *               order_id:
 *                 type: string
 *               payment_method:
 *                 type: object
 *     responses:
 *       200:
 *         description: Payment created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 */
router.post('/payments', async (req: Request, res: Response) => {
  try {
    const { order_id, payment_method } = req.body;

    if (!order_id) {
      return res.status(400).json({ error: 'order_id is required' });
    }

    if (!payment_method) {
      return res.status(400).json({ error: 'payment_method is required' });
    }

    // Call Duffel API
    const duffelResponse = await duffelClient.request({
      method: 'POST',
      url: '/air/payments',
      data: {
        data: {
          order_id,
          payment_method,
        },
      },
    });

    const paymentData = duffelResponse.data;

    // Store in database
    const order = await prisma.duffelOrder.findUnique({
      where: { externalId: order_id },
    });

    if (order) {
      await prisma.duffelPayment.create({
        data: {
          externalId: paymentData.id,
          orderId: order.id,
          amount: parseFloat(paymentData.amount),
          currency: paymentData.currency,
          paymentMethod: paymentData.payment_method?.type || 'unknown',
          status: paymentData.status,
          gateway: paymentData.gateway,
          transactionId: paymentData.transaction_id,
        },
      });
    }

    res.json({
      success: true,
      data: paymentData,
    });
  } catch (error: any) {
    console.error('[Duffel] Create payment error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/duffel/payments/{id}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Duffel Enhanced]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Payment not found
 */
router.get('/payments/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Try Duffel API first
    try {
      const duffelResponse = await duffelClient.request({
        method: 'GET',
        url: `/air/payments/${id}`,
      });

      // Store/update in database
      const payment = await prisma.duffelPayment.findUnique({
        where: { externalId: String(id) },
      });

      if (payment) {
        await prisma.duffelPayment.update({
          where: { id: payment.id },
          data: {
            amount: parseFloat(duffelResponse.data.amount),
            currency: duffelResponse.data.currency,
            paymentMethod: duffelResponse.data.payment_method?.type || 'unknown',
            status: duffelResponse.data.status,
            gateway: duffelResponse.data.gateway,
            transactionId: duffelResponse.data.transaction_id,
          },
        });
      }

      return res.json({
        success: true,
        data: duffelResponse.data,
      });
    } catch (duffelError) {
      // Fallback to database
      const payment = await prisma.duffelPayment.findUnique({
        where: { externalId: String(id) },
      });

      if (payment) {
        return res.json({
          success: true,
          data: payment,
        });
      }

      return res.status(404).json({ error: 'Payment not found' });
    }
  } catch (error: any) {
    console.error('[Duffel] Get payment error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// AIRLINE-INITIATED CHANGES - Proactive Changes
// ============================================================================

/**
 * @swagger
 * /api/duffel/airline-initiated-changes:
 *   get:
 *     summary: List airline-initiated changes
 *     tags: [Duffel Enhanced]
 *     parameters:
 *       - in: query
 *         name: order_id
 *         required: false
 *         schema:
 *           type: string
 *         description: Order ID to filter changes
 *     responses:
 *       200:
 *         description: Airline-initiated changes retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 */
router.get('/airline-initiated-changes', async (req: Request, res: Response) => {
  try {
    const { order_id } = req.query;

    // Build query parameters
    const params = new URLSearchParams();
    if (order_id) params.append('order_id', order_id as string);

    // Call Duffel API
    const duffelResponse = await duffelClient.request({
      method: 'GET',
      url: `/air/airline_initiated_changes?${params}`,
    });

    // Store in database
    if (duffelResponse.data.data && Array.isArray(duffelResponse.data.data)) {
      const changes = duffelResponse.data.data;

      for (const change of changes) {
        const order = await prisma.duffelOrder.findUnique({
          where: { externalId: change.order_id },
        });

        if (order) {
          await prisma.duffelAirlineInitiatedChange.upsert({
            where: { externalId: change.id },
            update: {
              changeType: change.change_type,
              details: change.details,
              actionTaken: change.action_taken,
              status: change.status,
              expiresAt: change.expires_at ? new Date(change.expires_at) : null,
            },
            create: {
              externalId: change.id,
              orderId: order.id,
              changeType: change.change_type,
              details: change.details,
              actionTaken: change.action_taken,
              status: change.status,
              expiresAt: change.expires_at ? new Date(change.expires_at) : null,
            },
          });
        }
      }
    }

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error('[Duffel] List airline-initiated changes error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/duffel/airline-initiated-changes/{id}:
 *   patch:
 *     summary: Update airline-initiated change response
 *     tags: [Duffel Enhanced]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Airline-initiated change ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action_taken]
 *             properties:
 *               action_taken:
 *                 type: object
 *     responses:
 *       200:
 *         description: Airline-initiated change updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 */
router.patch('/airline-initiated-changes/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action_taken } = req.body;

    if (!action_taken) {
      return res.status(400).json({ error: 'action_taken is required' });
    }

    // Call Duffel API
    const duffelResponse = await duffelClient.request({
      method: 'PATCH',
      url: `/air/airline_initiated_changes/${id}`,
      data: {
        data: { action_taken },
      },
    });

    // Update in database
    await prisma.duffelAirlineInitiatedChange.updateMany({
      where: { externalId: String(id) },
      data: {
        actionTaken: action_taken,
        status: duffelResponse.data.status,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error('[Duffel] Update airline-initiated change error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/duffel/airline-initiated-changes/{id}/accept:
 *   post:
 *     summary: Accept airline-initiated change
 *     tags: [Duffel Enhanced]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Airline-initiated change ID
 *     responses:
 *       200:
 *         description: Airline-initiated change accepted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 */
router.post('/airline-initiated-changes/:id/accept', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Call Duffel API
    const duffelResponse = await duffelClient.request({
      method: 'POST',
      url: `/air/airline_initiated_changes/${id}/actions/accept`,
    });

    // Update in database
    await prisma.duffelAirlineInitiatedChange.updateMany({
      where: { externalId: String(id) },
      data: {
        actionTaken: 'accept',
        status: 'accepted',
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error('[Duffel] Accept airline-initiated change error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Export Router
// ============================================================================

export default router;

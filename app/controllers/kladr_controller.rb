class KladrController < ApplicationController
  def list
    #if params[:query].length > 0
      @items = Kladr.where("code like '__00000000000' AND name like concat('%', concat(?, '%'))", params[:q]).order('name')
    #else
     # @items = Kladr.limit(100)
    #end
    
    respond_to do |format|
      format.html # list.html.erb
      format.json { render :json => @items }
    end
  end
end
